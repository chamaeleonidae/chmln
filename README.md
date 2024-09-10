# Chameleon JavaScript Library

Easily add Chameleon to your product!

The Chameleon JavaScript Library is a set of methods attached to a global `chmln` object intended to be used by applications to display Chameleon Experiences to users.

## Installation via NPM

This library is available as a package on NPM. To install into a project using NPM with a front-end packager such as Webpack or Browserify:

```
  npm install --save @chamaeleonidae/chmln
```

You can grab your [token](https://app.chameleon.io/setup/install) then require the lib like a standard Node.js module:

```javascript
const chmln = require('@chamaeleonidae/chmln');

chmln.init('YOUR_TOKEN', { fastUrl: 'https://fast.chameleon.io/' });
```

> Note for accounts created before *2022-05-21* you must omit the fastUrl
> If you're unsure, verify your account-specific instructions on the [installation page](https://app.chameleon.io/setup/install).

```javascript
chmln.init('YOUR_TOKEN');
```

> To use Chameleon as first-party (i.e. via `chameleon.your-product.com`), first [contact us](https://app.chameleon.io/help) to set this up, then use this updated script with your custom domain.

```javascript
chmln.init('YOUR_TOKEN', { fastUrl: 'https://chameleon.your-product.com/' }); // << CHANGE ME
```

## Usage

First, follow the installation process above. The script loads asynchronously and won’t affect your page loading times.

Next, identify your users by sending a unique ID (this normally matches the UIDs from your database). Without this, Chameleon can’t display Experiences to users. You should also [send additional user data](https://help.trychameleon.com/en/articles/1226443-how-do-i-send-my-users-data-to-chameleon) (such as “email address”, “role”) or company data (such as “plan type”, “subdomain”) so you can target Experiences to the right users, at the right time.


```javascript
chmln.identify(USER.ID_IN_DB, {     // REQUIRED Unique ID of each user in your database (e.g. 23443 or "590b80e5f433ea81b96c9bf6")
  email: USER.EMAIL,                // RECOMMENDED Used to connect data coming from various integrations

  // SUGGESTED - User properties:
  created: USER.SIGN_UP_DATE,       // Send dates in ISO or unix timestamp format (e.g. "2017-07-01T03:21:10Z" or 1431432000)
  name: USER.NAME,                  // We will parse this to extra first and surnames (e.g. "James Doe")
  role: USER.ROLE,                  // Send properties useful for targeting types of users (e.g. "Admin")
  logins: USER.LOGIN_COUNT,         // Send any data about user engagement (e.g. 39)
  project: USER.PROJECT_ID,         // Send any unique data for a user that might appear in any page URLs (e.g. 09876 or "12a34b56")

  // OPTIONAL - Company properties:
  company: {                        // For B2B products, send company / account information here
    uid: COMPANY.ID_IN_DB,          // Unique ID of the company / account in your database (e.g. 9832 or "590b80e5f433ea81b96c9bf7")
    created: COMPANY.SIGN_UP_DATE,  // To enable targeting all users based on this company property
    name: COMPANY.NAME,             // Send any data that appears within URLs, such as subdomains (e.g. "airbnb")
    trial_ends: COMPANY.TRIAL_ENDS, // Send data about key milestones (e.g. "2017-08-01T03:21:10Z")
    version: COMPANY.VERSION,       // If your software varies by version then this will help show the correct guidance (e.g. "1.56")
    plan: COMPANY.PLAN,             // Send null when no value exists (e.g. "Gold", "Advanced")
    spend: COMPANY.CLV              // Send other properties that will help in targeting users (e.g. sales rep, source, stage)
  }
});
```

Optionally you have the ability to track user events:

```javascript
chmln.track(PLAN_CHANGED);          // Example event "PLAN_CHANGED" can be used for targeting or measuring success
chmln.track(ACTIVATED);             // Having a defined activation point can be helpful for targeting onboarding experiences.
```
