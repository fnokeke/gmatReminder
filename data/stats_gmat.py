"""
filename: stats_gmat.py
description: get stats of all users on the dashboard
"""

import json
import requests


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


# three files: (1)all user profiles (2)all practices (3)all reminders
def store_data(data, filenames):
    """ extract users from data object and store the info in 3 files """
    if not data:
        return

    users = data['objects']
    for user in users:
        code, profile, practices, reminders = get_info(user)

        if not profile and not practices and not reminders:
            CSV_FILE.num_skipped += 1
            continue

        store_profile(profile, filenames['profiles'])
        store_practices(practices, filenames['practices'], code)
        store_reminders(reminders, filenames['reminders'], code)

        CSV_FILE.num_stored += 1


def get_info(user):
    """ obtain three categories of info for given user """

    # ignore other database entries and only fetch entries tagged as 'first_120'
    if user['reason_for_creation'] != 'first_120':
        CSV_FILE.not_first_120 += 1
        return [None, None, None, None]

    practices = user['practices']
    reminders = user['reminders']
    no_of_practices, no_of_reminders = len(practices), len(reminders)

    account, code = user['account'], user['code']
    has_contingency, has_deadline = user['has_contingency'], user['has_deadline']
    email, student_id = account['email'], account['student_id']

    key = '{code}, {student_id}, {email}, {no_of_practices}, {no_of_reminders}, \
           {has_contingency}, {has_deadline}'

    profile = key.format(
        code=code,
        student_id=student_id,
        email=email,
        no_of_practices=no_of_practices,
        no_of_reminders=no_of_reminders,
        has_contingency=has_contingency,
        has_deadline=has_deadline)

    return code, profile, practices, reminders  # str, str, list, list


def store_profile(profile, filename):
    """ append all users' profiles in one file """

    if not profile:
        return

    with open(filename, 'a') as f:
        f.write(profile)
        f.write('\n')

    CSV_FILE.count += 1


def store_practices(practices, filename, user_code):
    """ append all users' practices in single file """

    if not practices:
        with open(filename, 'a') as f:
            content = '{}, no practice \n'.format(user_code)
            f.write(content)
        return

    with open(filename, 'a') as f:
        for practice in practices:
            student_id = practice['student_id']
            question_count = practice['question_count']
            percent_correct = practice['percent_correct']
            duration = practice['duration']
            taken_on = practice['taken_on']

            li = [user_code, student_id, taken_on, question_count, percent_correct, duration, '\n']
            li = [str(x) for x in li]
            content = ','.join(li)
            f.write(content)


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

            li = [user_code, student_id, remind_time, created_at, '\n']
            li = [str(x) for x in li]
            content = ','.join(li)
            f.write(content)

            # FIXME: convert time to israel time
            # TODO: more testing

        #########################################
        #                main
        #########################################


if __name__ == '__main__':

    print 'Downloading stats info...'

    assert CSV_FILE.num_stored == 0, 'oops! num_stored should = 0'
    assert CSV_FILE.num_skipped == 0, 'uh oh! num_skipped should = 0'

    stores = {
        'profiles': 'profiles.csv',
        'reminders': 'reminders.csv',
        'practices': 'practices.csv',
    }

    # empty existing storage because data will later be appended to storage
    for _, store in stores.items():
        with open(store, 'w'):
            pass

    start, end = 1, 14
    for page_num in range(start, end):
        print '*************************'
        print 'Fetching page{} data...'.format(page_num)
        details = fetch_data(page_num)
        store_data(details, stores)

    assert CSV_FILE.count <= CSV_FILE.limit, 'CSV_FILE should be <= limit'

    print 'Number of users stored: {}'.format(CSV_FILE.num_stored)
    print 'Number of users skipped: {}'.format(CSV_FILE.num_skipped)
    print 'Not first_120: {}'.format(CSV_FILE.not_first_120)
    print 'Total users: {}'.format(CSV_FILE.num_stored + CSV_FILE.num_skipped)
    print 'Done!'
