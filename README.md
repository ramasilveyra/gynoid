# gynoid

Auth0 NodeJs ChatOps Service

## Prerequisite

Create a new Slack Bot and take note of its token. See the Slack [documentation](https://api.slack.com/bot-users#how_do_i_create_custom_bot_users_for_my_team)

## How to use it

1. Install dependencies

  ```
  npm install
  ```

1. Create a configuration file: `/etc/gynoid.config.json` with the following setting:

  ```
  {
    "droids": {
      "gynoid": {
        "token": "{slack-token}",
        "extensions": [
          "gynoid"
        ]
      }
    }
  }
  ```

1. Provide access to the configuration file so the user that runs the service can read and update the configuration

  ```
  sudo chown user: /etc/gynoid.config.json
  ```

1. Run!

  ```
  node server.js
  ```

## Using Gynoid

In Slack, your bot will start accepting commands. **Gynoid** is the base droid that manages other droids, you can install new droid from GitHub, add environment variables (such as keys required by your other droids), etc.

You can start a new Slack bot by telling this command to Gynoid (direct message) :

```
install droid from {user}/{repo} using {token}
```

For example:

```
install droid from auth0/my-droid using {slack-token}
```

## Extending Droids

Once a droid is registered, you can extend its functionality. When installing a droid without using a token, **Gynoid** will try to locate an existing bot, clone the repository, and add the new functions. Tell Gynoid the following in Slack to extend a droid:

```
install droid from auth0/droid-extensions
```

The `droid.json` file in the repository must use the same droid name in order to extend it.

> **Note**: You can prevent extensions by adding the variable `extendable: false` in your `droid.json`
