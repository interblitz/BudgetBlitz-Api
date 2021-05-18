setupWebix();
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
//Webix lib settings and extendings
////////////////////////////////////////////////

function setupWebix(){
    
    //Need for treating numbers as numbers not as strings
    webix.extend(webix.ui.text, {
      $init: function(config){
        if(config.type=="number"){
          var getValue = this.getValue;
          this.getValue = function(){
            return Number(getValue.apply(this, arguments));
          }
        }
      }
    })
    //--

    //Need for loading data from nested sources
    webix.protoUI({
            name:"nestedtable",
      setValue:function(value){
          this.clearAll();
          this.parse(value);
        },
            getValue:function(){ return this.serialize(); }
    }, webix.ui.datatable);
    //--//--

    var date = new Date();
    var startDate = new Date(date.getFullYear(), date.getMonth(), 1);
    var endDate   = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    webix.DataDriver.json.parseDates = true;
    
}

////////////////////////////////////////////////
//End Webix lib settings and extendings
////////////////////////////////////////////////


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
                    ]},
                    {view: "button", label: "Try again",   id: "tryAgain",   width: 300, align:"center", click: function () {
                                webMain(serverUrl);
                            }
                    }
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
                {cols: [
                        {view: "sidebar", width: 300, data: menuData, on: {
                                onAfterSelect: function (id) {
                                    console.debug(this.getItem(id));
                                    
                                    showView($$("viewsContainer"), this.getItem(id));
                                }
                            }},
                        {id:"viewsContainer", 
                            animate:{
                                      type:"flip",
                                      subtype:"vertical"
                                  },
                            keepViews: true,
                          cells:[
                            {view:"template"}
                          ]
                        }
                    ]}
                    
                    
            ]}
        ]
    }, $$('uiMainContainer'));
    
}
////////////////////////////////////////////////
//End UI layout
////////////////////////////////////////////////

////////////////////////////////////////////////
//Dynamic UI layout
////////////////////////////////////////////////

function showView(viewsContainer, action){
    
    var viewId          = action.collection;
    
    if($$(viewId)){
        viewsContainer.setValue(viewId);
    } else {

        var collection        = action.resources + "/" + action.collection;
        //var detailsCollection = "/collections/transactiondetails";
        var treeOptions       = "?data-format=tree&nested-format=ids";
        var columnsPath       = "/webix-columns?options=true";
        var formPath          = "/webix-form";
        var suggestionsPath   = "/suggestions";

        var collectionUrl        = serverUrl + baseUrl + collection;
        //var detailsCollectionUrl = serverUrl + baseUrl + detailsCollection;

        webix.ajax(collectionUrl + columnsPath,).then(function(data){
            var columnsConfig   = data.json();
            var dataUrl         = collectionUrl + treeOptions;

            var view      = getDataView(dataUrl, viewId, columnsConfig, action);

            viewsContainer.addView(view);
            viewsContainer.setValue(viewId);
        });
        
    }
    
}

function getDataView(dataUrl, viewId, columnsConfig, action) {
    
  var date = new Date();
  var startDate = new Date(date.getFullYear(), date.getMonth(), 1);
  var endDate   = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  
  var dateRangeParams;
  
  if(action.periodical){
      dateRangeParams = getRangeParams(startDate, endDate);
  } else {
      dateRangeParams = "";
  }
  
  var viewTable = {
       view: "treetable",
       minWidth: 100,
       id: getSubviewId(viewId, "treetable"),

       resizeColumn:true,
       fixedRowHeight:false,
       tooltip:true,

       headermenu:true,
       select:true,

       columns: columnsConfig,

       url:         dataUrl + dateRangeParams,
       bzBaseUrl:   dataUrl,

       on:{
            onItemDblClick:function(e, id, node){

//                console.debug(JSON.stringify(e));
//                console.debug(JSON.stringify(id));
//                console.debug(JSON.stringify(node));
//
//                showEditor(e.row);
          }
        }

   };
   
   return webix.ui({
       id: viewId,
        rows: [
          { view: "toolbar",
            elements: [
              {view: "button", label: webix.i18n.appStrings.action_new,      id: getSubviewId(viewId, "newElement"),      width: 150, hidden: action.readonly/*, click: "newElement"*/},
              {view: "button", label: webix.i18n.appStrings.action_edit,     id: getSubviewId(viewId, "editElement"),     width: 150, hidden: action.readonly/*, click: "editElement"*/},
              {view: "button", label: webix.i18n.appStrings.action_copy,     id: getSubviewId(viewId, "copyElement"),     width: 150, hidden: action.readonly/*, click: "copyElement"*/},
              {view: "button", label: webix.i18n.appStrings.action_delete,   id: getSubviewId(viewId, "deleteElement"),   width: 150, hidden: !action.deletable/*, click: "deleteElement"*/},
              {view:"daterangepicker", label:webix.i18n.appStrings.action_range, id: getSubviewId(viewId, "dateRange"),   width:500, hidden: !action.periodical,
                     value:{start:  startDate,
                            end:    endDate
                          },
                    on: {
                      onChange:function(){
                          refreshTreeTable( getSubviewId(viewId, "dateRange") );
                      }
                    }
              },
              {view:"icon", icon:"mdi mdi-refresh",  id: getSubviewId(viewId, "refresh"),  click: "refreshTreeTable"}
            ]
          },
           viewTable
        ]
    });

}

function getSubviewId(viewId, subId){
    return viewId + "__" + subId;
}

function getViewId(subviewId){
    
    var ids = subviewId.split("__");
    
    if(ids.length > 0){
        return ids[0];
    } else {
        return subviewId;
    }
    
}

function refreshTreeTable(id){
    
  var viewId    = getViewId(id);
  var treeTable = $$(getSubviewId(viewId, "treetable"));
  var dateRange = $$(getSubviewId(viewId, "dateRange"));
  var dateRangeParams;
  
  if(dateRange.config.hidden){
      dateRangeParams = "";
  } else {
      dateRangeParams = getRangeParams(dateRange.getValue().start, dateRange.getValue().end);
  }
  
  treeTable.clearAll();
  treeTable.load(treeTable.config.bzBaseUrl + dateRangeParams );
    
}

function getRangeParams(startDate, endDate){

  var dateformat = webix.Date.dateToStr("%Y%m%d%H%i%s");

  var strStartDate;
  if(!!startDate){
    strStartDate = "&mDateTime=" + dateformat(startDate);
  } else {
    strStartDate = "";
  }

  var strEndDate;
  if(!!endDate){
    endDate.setHours(23);
    endDate.setMinutes(59);
    endDate.setSeconds(59);

    strEndDate = "&mDateTime_01=" + dateformat(endDate);
  } else {
    strEndDate = "";
  }

  console.debug(strStartDate);
  console.debug(strEndDate);

  return strStartDate + strEndDate;
}

////////////////////////////////////////////////
//End Dynamic UI layout
////////////////////////////////////////////////
