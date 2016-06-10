# gynoid

Auth0 NodeJs ChatOps Service

## Prerequisite

Create a new Slack Bot and take note of its token. See the Slack [documentation](https://api.slack.com/bot-users#how_do_i_create_custom_bot_users_for_my_team).

Additionally, generate a GitHub personal access token if you want to install droids directly from GitHub.

## How to use it

1. Install dependencies

  ```
  npm install
  ```

1. Create a configuration file: `/etc/gynoid.config.json` with the following setting:

  ```
  {
    "keys": {
      "GITHUB_TOKEN": "{personal-access-token}",
      "GYNOID_TOKEN": "{slack-token}"
    }
  }
  ```

1. Provide access to the configuration file so the user that runs the service can read and update the configuration

  ```
  sudo chown user: /etc/gynoid.config.json
  ```

1. Run! The default droid "Gynoid" will be cloned from GitHub and start listening commands in Slack.

  ```
  node server.js
  ```


## Using Gynoid

In Slack, your bot will start accepting commands. **Gynoid** is the base droid that manages other droids, you can install new droid from GitHub, add environment variables (such as keys required by your other droids), etc.

You can start a new Slack bot by _telling_ this command to Gynoid (direct message) :

```
register {name} using {slack-token}
```

For example:

```
register my-droid using {slack-token}
```

In this case, the name is just an internal identifier and it's not related to the bot name or Slack configuration.

Once registered, the bot is online but it doesn't have any listener on it. You need to **extend** the droid.

## Authoring Droids

To create your own **Droid Extension** you need at least two files:

- **droid.json**: Contains the metadata required to install actions, aliases, and ACLs.
- **Script**: Your NodeJS file which exports an object with the different "actions" your droid can execute.

See [Marvin Droid JSON](https://github.com/auth0/marvin-droid/blob/master/droid.json) and [Mandrill Droid Script](https://github.com/auth0/marvin-droid/blob/master/index.js) as samples.

Once created, you can extend it using Gynoid in Slack:

```

```

## Extending Droids

Once a droid is registered, you can extend its functionality. When installing a droid without using a token, **Gynoid** will try to locate an existing bot, clone the repository, and add the new functions. Tell Gynoid the following in Slack to extend a droid:

```
extend droid from org/repo
```

For example:

```
extend marvin from auth0/marvin-droid
```

Your droid is now ready to use. You can install multiple extensions to the same droid.

> **Note**: You can prevent extensions by adding the variable `extendable: false` in your `droid.json`
