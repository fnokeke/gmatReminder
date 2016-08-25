"""
filename: stats_gmat.py
description: get stats of all users on the dashboard
"""

import json
import datetime
import pytz
import requests


# counter for keeping track of files
# there should be 120 files in total
class CSV_FILE(object):
    """ simple class to just keep count of number of users' account """
    count = 0
    limit = 124
    num_stored = 0
    num_skipped = 0
    not_first_120 = 0
    unique_users = {}

    stores = {
        'profiles': 'profiles.csv',
        'reminders': 'reminders.csv',
        'practices': 'practices.csv',
    }


    profiles_header = 'code,student_id,email,no_of_practices,no_of_reminders,' +\
                      'has_contingency,has_deadline,has_latest_version'

    practices_header = 'code,taken_on,question_count,percent_correct,duration,' +\
                       'reminder_time,created_at,relative_diff'

    reminders_header = 'code,student_id,remind_time,created_at'


def prepare_storage(files):
    """ reset files and add their respective headers """
    for label, store in CSV_FILE.stores.items():
        with open(store, 'w') as f:
            if label == 'profiles':
                f.write(CSV_FILE.profiles_header + '\n')
            elif label == 'reminders':
                f.write(CSV_FILE.reminders_header + '\n')
            elif label == 'practices':
                f.write(CSV_FILE.practices_header + '\n')


def fetch_data(page):
    """ REST request to gmat api to fetch paginated info for all users """
    url = 'http://slm.smalldata.io/gmat/api/student?page={0}'.format(page)
    r = requests.get(url)
    if r.status_code != 200:
        print '****************************'
        print url
        print 'Error: page{0}'.format(page)
        print '{0}: {1}'.format(r.status_code, r.text)
        return

    return json.loads(r.text)


# three files: (1)all user profiles (2)all practices (3)all reminders
def store_data(data, filenames):
    """ extract users from data object and store the info in 3 files """
    if not data:
        return

    users = data['objects']
    for user in users:
        code, has_deadline, profile, practices, reminders = get_info(user)

        if not profile and not practices and not reminders:
            CSV_FILE.num_skipped += 1
            continue

        store_profile(profile, filenames['profiles'])
        store_reminders(reminders, filenames['reminders'], code)
        store_practices(practices, filenames['practices'], code, has_deadline)

        CSV_FILE.num_stored += 1


def get_info(user):
    """ obtain three categories of info for given user """

    # ignore other database entries and only fetch entries tagged as 'first_120'
    if user['reason_for_creation'] != 'first_120':
        CSV_FILE.not_first_120 += 1
        return [None, None, None, None, None]

    practices = user['practices']
    reminders = user['reminders']
    no_of_practices, no_of_reminders = len(practices), len(reminders)

    account, code = user['account'], user['code']
    has_contingency, has_deadline = user['has_contingency'], user['has_deadline']
    email, student_id = account['email'], account['student_id']

    has_latest_version = len(user['audit_events']) > 0  # auditing was added in latest app version

    key = '{code}, {student_id}, {email}, {no_of_practices}, {no_of_reminders}, \
           {has_contingency}, {has_deadline}, {has_latest_version}'

    profile = key.format(
        code=code,
        student_id=student_id,
        email=email,
        no_of_practices=no_of_practices,
        no_of_reminders=no_of_reminders,
        has_contingency=has_contingency,
        has_deadline=has_deadline,
        has_latest_version=has_latest_version)

    return code, has_deadline, profile, practices, reminders  # str, str, list, list


def store_profile(profile, filename):
    """ append all users' profiles in one file """

    if not profile:
        return

    with open(filename, 'a') as f:
        f.write(profile + '\n')

    CSV_FILE.count += 1


def store_practices(practices, filename, user_code, has_deadline):
    """ append all users' practices in single file """

    if not practices:
        with open(filename, 'a') as f:
            content = '{}, no practice \n'.format(user_code)
            f.write(content)
        return

    with open(filename, 'a') as f:
        li = [user_code]
        for practice in practices:
            taken_on = practice['taken_on']
            taken_on = to_israeltime(taken_on)
            taken_on = to_fancydatetime(taken_on)
            li.append(practice['taken_on'])

            li.append(practice['question_count'])
            li.append(practice['percent_correct'])
            li.append(practice['duration'])

            rwt = practice['reminder_when_taken']
            rwt_remind_time, rwt_created_at = None, None
            if rwt:
                rwt_remind_time = normalize(rwt['remind_time']).strftime('%-I:%M %p')
                rwt_created_at = rwt['created_at']

            li.append(rwt_remind_time)
            li.append(rwt_created_at)

            relative_diff = get_relative_diff(practice['taken_on'], rwt, has_deadline)
            li.append(relative_diff)

            li = [str(x) for x in li]
            content = ','.join(li)
            f.write(content + '\n')


def store_reminders(reminders, filename, user_code):
    """ append all users' reminders in one file """

    if not reminders:
        with open(filename, 'a') as f:
            content = '{}, no reminder \n'.format(user_code)
            f.write(content)
        return

    with open(filename, 'a') as f:
        for reminder in reminders:
            student_id = reminder['student_id']
            remind_time = reminder['remind_time']
            created_at = reminder['created_at']

            li = [user_code, student_id, remind_time, created_at]
            li = [str(x) for x in li]
            content = ','.join(li)
            f.write(content + '\n')


def normalize(remind_time):
    """ convert hr:mm:ss remind time to datetime """
    try:
        if ':' in remind_time:
            hours, minutes = remind_time.split(":")[:2]
        elif '.' in remind_time:
            hours, minutes = remind_time.split(".")[:2]
        else:
            raise ValueError("%s doesn't contain hour-minute separator" % remind_time)

        return datetime.time(hour=int(hours), minute=int(minutes))
    except ValueError:
        print "Invalid time: %s" % remind_time
        raise


def to_datetime(datestr):
    """ convert date string to datetime """
    return datetime.datetime.strptime(datestr.split('.')[0], '%Y-%m-%dT%H:%M:%S')


def to_israeltime(date, fmt=None):
    """ convert time to israel timezone """
    return pytz.utc.localize(to_datetime(date)).astimezone(pytz.timezone('Israel'))


def to_fancydatetime(date, fmt=None):
    """ convert datetime to string format with timezone """
    return date.strftime('%Y/%m/%d, %-I:%M %p (%Z)')


def get_relative_diff(taken_on, rwt, has_deadline):  # rwt = reminder_when_taken
    """ show relative difference reminder time and time practice session was taken """

    if not taken_on or not rwt:
        return

    hr, mins = rwt['remind_time'].split(':')[:2]
    remind_time = to_datetime(rwt['created_at']).replace(hour=int(hr), minute=int(mins))

    notif_limit = 15
    remind_total = remind_time.hour * 60 + remind_time.minute
    remind_total = remind_total + notif_limit if has_deadline else remind_total

    taken_on = to_datetime(taken_on)
    taken_total = taken_on.hour * 60 + taken_on.minute
    mins_diff = abs(remind_total - taken_total)

    if taken_total <= remind_total:
        return to_diff_format(mins_diff) + ' before reminder'
    else:
        return to_diff_format(mins_diff) + ' after reminder'


def to_diff_format(num_of_mins):
    """ convert number of mins to proper display in mins or in hours """
    if num_of_mins <= 1:
        return '1 min'
    elif num_of_mins < 60:
        return '{} mins'.format(num_of_mins)

    num_of_hrs = round(10 * num_of_mins / 60.0) / 10  #1dp
    if num_of_hrs == 1.0:
        return "1 hour"
    elif num_of_hrs > 1.0:
        return '{} hrs'.format(num_of_hrs)

#########################################
#                main
#########################################
if __name__ == '__main__':

    print 'Downloading stats info...'

    assert CSV_FILE.num_stored == 0, 'oops! num_stored should = 0'
    assert CSV_FILE.num_skipped == 0, 'uh oh! num_skipped should = 0'

    prepare_storage(CSV_FILE.stores)
    start, end = 1, 14
    for page_num in range(start, end):
        print '*************************'
        print 'Fetching page{} data...'.format(page_num)
        details = fetch_data(page_num)
        store_data(details, CSV_FILE.stores)

    assert CSV_FILE.count <= CSV_FILE.limit, 'CSV_FILE should be <= limit'

    print 'Number of users stored: {}'.format(CSV_FILE.num_stored)
    print 'Number of users skipped: {}'.format(CSV_FILE.num_skipped)
    print 'Not first_120: {}'.format(CSV_FILE.not_first_120)
    print 'Total users: {}'.format(CSV_FILE.num_stored + CSV_FILE.num_skipped)
    print 'Done!'
