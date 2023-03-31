# Upload to Sirv
An action that allows you to upload a specific folder's content to Sirv <a href="https://sirv.com/">image CDN</a>.

## Workflow example
Here's an example of how to automatically upload images to Sirv from a folder.
- Create a `.github/workflows/sirv-upload.yml` file:
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
      - uses: sirv/gh-action-sirv@main
        name: Upload to Sirv
        id: Sirv
        with:
          clientId: ${{ secrets.clientId }}
          clientSecret: ${{ secrets.clientSecret}}
          source_dir: 'upload'
          output_dir: 'upload'
          purge: false
```
- Create a Sirv API client. You can do this in your [Sirv account settings](https://my.sirv.com/#/account/settings/api).
- Add `clientId` and `clientSecret` ENV variables in your repo settings.

## Action inputs

The following settings must be passed as environment variables as shown in the example above.

| name                    | description                                                  |
| ----------------------- | ------------------------------------------------------------ |
| `clientId`            | (Required) Your Sirv client ID key. [Get it here.](https://my.sirv.com/#/account/settings/api) |
| `clientSecret` | (Required) Your Sirv client secret. [Get it here.](https://my.sirv.com/#/account/settings/api) |
| `source_dir`            | (Required) The local directory (or file) you wish to upload to Sirv. |
| `output_dir`       | (Optional) The destination directory in Sirv. |
| `purge`       | (Optional) Sync your repo images with Sirv. Setting this to true will delete files from Sirv which aren't present in your repo.  |


