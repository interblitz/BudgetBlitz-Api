# Budget Blitz Rest Api

http://bbmoney.biz

Api and samples are in beta stage. Make backup before use POST and DELETE queries with working database.

## Requirements

Budget Blitz 8.4.1b3 app installed on Android device

## Getting Started

- Enable PC connection from the app (http://bbmoney.biz/en/manual/remote-access.html)
- Run samples from the samples dir
- Put server address before retrieving data

Server address is http://[server]:[port]. Server and port will be available after PC connection enabled. 

Since Budget Blitz 8.4.1b4 secure [https](https://en.wikipedia.org/wiki/HTTPS) protocol supported with [Self-signed certificate](https://en.wikipedia.org/wiki/Self-signed_certificate). New Self-signed certificate generates each time PC connection enabled. **You have to tell your browser to trust connection**.
For secure connection use server address with secure port 9080 (Pro version) or 9081 (Free version)

https://[server]:[port]

Or use secure shortcut (automatic redirect) on port 9070 (Pro version) or 9071 (Free version)

[server]:[port]

### Troubleshooting

- "No connection" error occures for correct http address

Allow [mixed content](https://stackoverflow.com/questions/18321032/how-to-get-chrome-to-allow-mixed-content).

- "No connection" error occures for correct https address

Go direct to https://[server]:1[port] and add exception for this address in your browser. It is really safe.

## Api Documentation

- Enable PC connection from the app (http://bbmoney.biz/en/manual/remote-access.html)
- Run swagger/index.html from local PC or [online repository](https://interblitz.github.io/BudgetBlitz-Api/swagger/)
- Put api specification path and press Explore

Api specification path is http://[server]:[port]/api/v1/docs.json. Server and port will be available after PC connection enabled.

## Api Samples

- Categories inline editor [Live Demo](https://interblitz.github.io/BudgetBlitz-Api/samples/01-Categories/01-CategoriesInlineEditor), [Source](/samples/01-Categories/01-CategoriesInlineEditor)
- Categories popup editor  [Live Demo](https://interblitz.github.io/BudgetBlitz-Api/samples/01-Categories/02-CategoriesPopupEditor), [Source](/samples/01-Categories/02-CategoriesPopupEditor)
- Transactions popup editor [Live Demo](https://interblitz.github.io/BudgetBlitz-Api/samples/02-Transactions/01-TransactionsPopupEditor), [Source](/samples/02-Transactions/01-TransactionsPopupEditor)
- Transactions popup editor, custom form [Live Demo](https://interblitz.github.io/BudgetBlitz-Api/samples/02-Transactions/02-TransactionsPopupEditorCustomForm), [Source](/samples/02-Transactions/02-TransactionsPopupEditorCustomForm)
- Transactions popup editor, icons support [Live Demo](https://interblitz.github.io/BudgetBlitz-Api/samples/02-Transactions/03-TransactionsPopupEditorIcons), [Source](/samples/02-Transactions/03-TransactionsPopupEditorIcons)
- Transactions, delete example [Live Demo](https://interblitz.github.io/BudgetBlitz-Api/samples/02-Transactions/04-TransactionsDelete), [Source](/samples/02-Transactions/04-TransactionsDelete)
- Transactions, localizing example [Live Demo](https://interblitz.github.io/BudgetBlitz-Api/samples/02-Transactions/05-TransactionsPopupEditorLocale), [Source](/samples/02-Transactions/05-TransactionsPopupEditorLocale)
- Transactions, transfer example [Live Demo](https://interblitz.github.io/BudgetBlitz-Api/samples/02-Transactions/06-TransactionsPopupEditorTransfer), [Source](/samples/02-Transactions/06-TransactionsPopupEditorTransfer)
- Transactions, suggestions example [Live Demo](https://interblitz.github.io/BudgetBlitz-Api/samples/02-Transactions/07-TransactionsPopupEditorSuggestions), [Source](/samples/02-Transactions/07-TransactionsPopupEditorSuggestions)
- Transactions, split example [Live Demo](https://interblitz.github.io/BudgetBlitz-Api/samples/02-Transactions/08-TransactionsPopupEditorDetails), [Source](/samples/02-Transactions/08-TransactionsPopupEditorDetails)
- Sidebar, simple example [Live Demo](https://interblitz.github.io/BudgetBlitz-Api/samples/03-Sidebar/01-Simple), [Source](/samples/03-Sidebar/01-Simple)
- Sidebar, actions example [Live Demo](https://interblitz.github.io/BudgetBlitz-Api/samples/03-Sidebar/02-ActionsListener), [Source](/samples/03-Sidebar/02-ActionsListener)
- Sidebar, app prototype example [Live Demo](https://interblitz.github.io/BudgetBlitz-Api/samples/03-Sidebar/03-ButtonsListener), [Source](/samples/03-Sidebar/03-ButtonsListener)

JavaScript library for building mobile and desktop web apps Webix (https://github.com/webix-hub) is used in samples.
