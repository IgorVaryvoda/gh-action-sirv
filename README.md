Here's an example of how to automatically upload images to Sirv from a folder.
- Create a .github/workflows/sirv-upload.yml file
```yaml
name: Sirv uploader
on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

  workflow_dispatch:

jobs:
  build:

    runs-on: ubuntu-latest
    environment: main
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-python@v3
        with:
          python-version: "3.10"
      - run: |
          python -m pip install --upgrade pip
          pip install requests
          if [ -f requirements.txt ]; then pip install -r requirements.txt; fi
          python run.py
        env:
          clientId: ${{ secrets.clientId }}
          clientSecret: ${{ secrets.clientSecret }}
          source_dir: 'upload'
```
- copy the [run.py](https://github.com/IgorVaryvoda/gh-action-sirv/blob/main/run.py) script to the root folder of your repo.
- create a repo environment called main (if you choose another env name, make sure to change the workflow code to reflect it.)
- Add clientId & clientSecret env variables. Both can both be found in your [Sirv account settings](https://my.sirv.com/#/account/settings/api) (create API client)
- edit the workflow yaml (last line) to choose the folder you'd like to upload to Sirv.