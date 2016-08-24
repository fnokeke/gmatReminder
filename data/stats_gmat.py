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


# three files: (1)all user profiles (2)all practices (3)all reminders
def store_data(data, filenames):
    """ extract users from data object and store the info in 3 files """
    if not data:
        return

    users = data['objects']
    print 'No of users: {}'.format(len(users))
    print

    for i, user in enumerate(users):
        profile, practices, reminders = get_info(user)
        if not (practices and reminders):
            continue

        store_profile(profile, filenames['profiles'])
        store_practices(practices, filenames['practices'])
        store_reminders(reminders, filenames['reminders'])

        print 'user{} info stored...'.format(i)


def get_info(user):
    """ obtain three categories of info for given user """
    practices = user['practices']
    reminders = user['reminders']
    no_of_practices, no_of_reminders = len(practices), len(reminders)

    account, code = user['account'], user['code']
    has_contingency, has_deadline = user['has_contingency'], user['has_deadline']
    email, student_id = account['email'], account['student_id']

    key = '{code}, {student_id}, {email}, {no_of_practices}, \
           {no_of_reminders}, {has_contingency}, {has_deadline}'

    profile = key.format(
        code=code,
        student_id=student_id,
        email=email,
        no_of_practices=no_of_practices,
        no_of_reminders=no_of_reminders,
        has_contingency=has_contingency,
        has_deadline=has_deadline)

    return profile, practices, reminders  # str, list, list


def store_profile(profile, filename):
    """ append all users' profiles in one file """
    assert CSV_FILE.count <= CSV_FILE.limit, 'CSV_FILE should be <= limit'

    with open(filename, 'a') as f:
        f.write(profile)
        f.write('\n')

    CSV_FILE.count += 1


def store_practices(practices, filename):
    """ append all users' practices in single file """

    if not practices:
        with open(filename, 'a') as f:
            f.write('No practice sessions')
            f.write('\n')

    with open(filename, 'a') as f:
        for practice in practices:
            student_id = practice['student_id']
            question_count = practice['question_count']
            percent_correct = practice['percent_correct']
            duration = practice['duration']
            taken_on = practice['taken_on']
            # reminder_when_taken = practice['reminder_when_taken']['remind_time']

            li = [student_id, taken_on, question_count, percent_correct, duration, '\n']
            li = [str(x) for x in li]
            content = ','.join(li)
            f.write(content)


def store_reminders(reminders, filename):
    """ append all users' reminders in one file """

    if not reminders:
        with open(filename, 'a') as f:
            f.write('No reminder sessions')
            f.write('\n')

    with open(filename, 'a') as f:
        for reminder in reminders:
            student_id = reminder['student_id']
            remind_time = reminder['remind_time']
            created_at = reminder['created_at']

            li = [student_id, remind_time, created_at, '\n']
            li = [str(x) for x in li]
            content = ','.join(li)
            f.write(content)

#########################################
# main
#########################################
if __name__ == '__main__':
    print 'Downloading stats info...'

    stores = {
        'profiles': 'profile.csv',
        'reminders': 'reminders.csv',
        'practices': 'practices.csv',
    }

    start, end = 1, 14
    for page_num in range(start, end):
        print 'Fetching page{} data...'.format(page_num)
        details = fetch_data(page_num)
        store_data(details, stores)

    print 'Done!'
