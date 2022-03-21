import os
import requests
import json
import sys
from urllib.parse import urlparse
"""

Instructions:

1. Create an API client ID and secret at: https://my.sirv.com/#/account/settings/api

2. Enter the API client ID and Client Secret into the Secrets section on the left (click the padlock icon). Make sure to name them like this:

  clientId:      your Client ID
  clientSecret:  your Client Secret

3. Copy the contents of your CSV file into the files.csv file on the left. Lines can be terminated with or without a space. It won't work if your data is TAB separated.

4. Click Run and the images will be uploaded to the /upload/ directory in your Sirv account (the folder will be created if it doesn't exist).

"""

# The script below will fetch files from your list into your Sirv account.

token =''
def get_token():
  sirvurl = 'https://api.sirv.com/v2/token'
  payload = {
      'clientId': os.environ['clientId'],
      'clientSecret': os.environ['clientSecret']
  }
  headers = {'content-type': 'application/json'}
  response = requests.request('POST', sirvurl, data=json.dumps(payload), headers=headers)
  global token
  if response:
    token = response.json()['token']
  else:
    print('There is an error in your credentials. Please check if your ID and secret are correct.')
    sys.exit()

def check_folder():
  get_token()
  sirvurl = 'https://api.sirv.com/v2/files/readdir?dirname=/upload/'
  headers = {
      'content-type': 'application/json',
      'authorization': 'Bearer %s' % token
  }
  response = requests.request('GET', sirvurl, headers=headers)
  status_code = response.status_code
  if status_code == 200:
    fetch_files()
  else:
    create_folder()
    fetch_files()


def create_folder():
  sirvurl = 'https://api.sirv.com/v2/files/mkdir?dirname=/upload/'
  headers = {
      'content-type': 'application/json',
      'authorization': 'Bearer %s' % token
  }
  requests.request('POST', sirvurl, headers=headers)

def fetch_files():
  directory = 'upload'
  for filename in os.listdir(directory):
      f = os.path.join(directory, filename)
      if os.path.isfile(f):
          url =""
          url = url.join(link)
          print('Processing file...')
          print(url)
          get_token()
          a = urlparse(url)
          filename = os.path.basename(a.path)
          sirvurl = 'https://api.sirv.com/v2/files/fetch'
          payload = {'url': url, 'filename': '/upload/' + filename}

          headers = {
              'content-type': 'application/json',
              'authorization': 'Bearer %s' % token
          }
          try:
            response = requests.request('POST', sirvurl, data=json.dumps(payload), headers=headers)
            print(response)
          except requests.exceptions.RequestException as e:
            raise SystemExit(e)
      f.close()

check_folder()
