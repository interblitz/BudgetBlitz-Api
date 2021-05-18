setupMainUI();

webMain(serverUrl);

function webMain(serverUrl){

    var requestLocale   = webix.ajax(serverUrl + baseUrl + "/resources/strings/locale");
    var requestStrings  = webix.ajax(serverUrl + baseUrl + "/resources/strings");
    var requestMenu     = webix.ajax(serverUrl + baseUrl + "/resources/actions");

    webix.promise.all([requestLocale, requestStrings, requestMenu]).then(function(results){
        var responseLocale  = results[0];
        var responseStrings = results[1];
        var responseMenu    = results[2];

        ///////////////////////////////////
        var locale = responseLocale.json();

        webix.Date.startOnMonday = (locale.firstDayOfWeek == 2);
        webix.i18n.setLocale(locale.locale);
        ///////////////////////////////////

        ///////////////////////////////////
        webix.i18n.appStrings = responseStrings.json();

        console.debug(webix.i18n.appStrings);
        ///////////////////////////////////

        ///////////////////////////////////
        var menuData = responseMenu.json();
        console.debug(menuData);
        ///////////////////////////////////

        setupUI(menuData);

    }, function(err){
        setupNoConnectionUI();
    });

}

////////////////////////////////////////////////
//UI layout
////////////////////////////////////////////////
function setupMainUI() {
    
    webix.ui({
        rows: [
            {view: "toolbar", padding: 3, elements: [
                    {view: "text", label: "Server address", id: "serverAddress", value: serverUrl,
                        on: {
                            onChange: function (newValue, oldValue, config) {
                                serverUrl       = newValue;
                                webMain(serverUrl);
                            }
                        }
                    }
            ]},
            {id:"uiMainContainer", rows:[]}
        ]
    });
    
}

function setupNoConnectionUI() {
    
    webix.ui({
        rows: [
            {id:"uiMainContainer", rows:[
                    { view:"label", label:"No connection for " + serverUrl, height:50, align:"center" },
                    {view: "toolbar", padding: 3, borderless:true, elements: [
                        {},
                        {view: "button", label: "User manual",              id: "manualEm",    width: 300, click: "window.open('http://bbmoney.biz/en/manual/remote-access.html', '_blank');"},
                        {view: "button", label: "Руководство пользователя", id: "manualRu",    width: 300, click: "window.open('http://bbmoney.biz/ru/manual/remote-access.html', '_blank');"},
                        {}
                    ]}
            ]}
            
        ]
    }, $$('uiMainContainer'));
    
}

function setupUI(menuData) {
    
    webix.ui({
        rows: [
            {id:"uiMainContainer", rows:[
                 
                {view: "toolbar", padding: 3, elements: [
                        {view: "button", type: "icon", icon: "mdi mdi-menu", width: 37, align: "left", css: "app_button",
                            click: function () {
                                $$("$sidebar1").toggle();
                            }
                        },
                        {view: "label", label: webix.i18n.appStrings.app_name},
                        {}
                    ]}
                ,
                {id:"uiContainer", rows:[]},
                {cols: [
                        {view: "sidebar", width: 300, data: menuData, on: {
                                onAfterSelect: function (id) {
                                    webix.message("Selected: " + this.getItem(id).value)

                                    console.debug(this.getItem(id));
                                }
                            }}
                    ]}
                    
                    
            ]}
        ]
    }, $$('uiMainContainer'));
    
}
////////////////////////////////////////////////
//End UI layout
////////////////////////////////////////////////
