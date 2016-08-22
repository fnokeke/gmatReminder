# get stats of all users on the dashboard

import requests
import json


def fetch_data(page):
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
class Counter(object):
    count = 0
    limit = 124


# store each user's data in a separate file
def write_to_file(data):
    if not data:
        return

    users = data['objects']
    print 'user len:', len(users)

    for user in users[:3]:
        Counter.count += 1
        assert Counter.count <= Counter.limit, 'Counter should be <= limit'

        filename = 'stats/{0}.csv'.format(Counter.count)
        header = 'code, student_id, email, no_of_practices, has_contingency, has_deadline'
        content = extract_user_content(Counter.count, header, user)

        with open(filename, 'w') as f:
            f.write(header)
            f.write('\n')
            f.write(content)


def extract_user_content(i, header, user):
    code = user['code']
    has_contingency = user['has_contingency']
    has_deadline = user['has_deadline']

    practices = user['practices']
    no_of_practices = len(practices)

    account = user['account']
    email = account['email']
    student_id = account['student_id']

    key = ['{' + x + '}' for x in header.split(', ')]
    key = ','.join(key)
    fmt = key.format(  # fmt = '{code}, {student_id}, {email} ...
        code=code,
        student_id=student_id,
        email=email,
        no_of_practices=no_of_practices,
        has_contingency=has_contingency,
        has_deadline=has_deadline)

    return fmt

#########################################
################ main ###################
#########################################
if __name__ == '__main__':
    print 'Downloading stats info...'

    for page in range(7, 8):
        data = fetch_data(page)
        write_to_file(data)

    print 'Done!'
