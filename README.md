# Gynoid

This is our Slack bots platform customized to satisfy our developers:

- **Bots made easy:** just create a JS file, add metadata, done!
- **Install from GitHb:** install bots in Slack from GitHub
- **Extend existing bots from different sources**: One bot, multiple functions, different repositories.

We call these extensions _Droids_. To install new extensions, we have a Gynoid that serves as a wrapper for this library. Our [Gynoid Droid](https://github.com/auth0/gynoid-droid) is reponsible of registering and extending our bots directly from Slack.

## What do you need?

Create a new Slack Bot and take note of its token. See the Slack [documentation](https://api.slack.com/bot-users#how_do_i_create_custom_bot_users_for_my_team).

Optionally, generate a GitHub personal [access token](https://help.github.com/articles/creating-an-access-token-for-command-line-use/) to install from your private GitHub repositories.

## How to use it

1. Clone this repository and install dependencies.

  ```sh
  npm install
  ```

1. Update the configuration file `gynoid.config.json` and replace the placeholder with your Slack token. If you want to install droids from your private repositories, add your personal GitHub token as well (leave it empty for public access).

  ```json
  {
    "keys": {
      "GITHUB_TOKEN": "",
      "GYNOID_TOKEN": "{slack-token}"
    }
  }
  ```

1. Run! The process will clone the **Gynoid droid** and it'll start listening commands in Slack.

  ```sh
  npm start
  ```

## Installing and Extending droids

In Slack, your Gynoid bot will start accepting commands to install or remove new bots. Each new bot requires a different Slack bot token, so if you want separate bots create new tokens for them.

By default, Gynoid droid accepts commands in a Slack channel named #gynoid_manage. We keep this channel private and only admins have access to it.

### Starting a new bot

In Slack, type the following command to start a new bot:

```
register {name} using {slack-token}
```

Where `{name}` is the name you want to register your bot (it's not the name of the bot in Slack, this name is used internally to extend or remove it). The {slack-token} is a new token or you can even re-use Gynoid's token to extend its functionality.

### Extending a bot

To extend a bot, use the following Gynoid command in Slack:

```
extend {name} from {user/repository}
```

Where `{name}` is the ID of the bot that you used when you registered it, and `{user/repository}` is the location in GitHub of the code you want to use to extend. For example:

```
extend my-bot from auth0/concierge-droid
```

## Authoring Droids

To create your own **Droid Extension** you need at least two files:

- **droid.json**: Contains the metadata required to install actions, aliases, and ACLs.
- **Script**: Your NodeJS file which exports an object with the different "actions" your droid can execute.

See the [Concierge Droid Metadata](https://github.com/auth0/concierge-droid/blob/master/droid.json) and [Concierge Droid Script](https://github.com/auth0/concierge-droid/blob/master/index.js) as samples.

Once a droid code is pushed to GitHub, you can access it via Slack by running the extend command using Gynoid:

```
extend {name} from {user/repo}
```

## Documentation

Coming soon! (Specially the JSON metadata definition)
