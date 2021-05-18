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
        
        webix.appRoutes = new Object();
        webix.appRoutes.treeOptions       = "?data-format=tree&nested-format=ids";
        webix.appRoutes.columnsPath       = "/webix-columns?options=true";
        webix.appRoutes.formPath          = "/webix-form";
        webix.appRoutes.suggestionsPath   = "/suggestions";
        
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
//        var treeOptions       = "?data-format=tree&nested-format=ids";
//        var columnsPath       = "/webix-columns?options=true";
//        var formPath          = "/webix-form";
//        var suggestionsPath   = "/suggestions";

        var collectionUrl        = serverUrl + baseUrl + collection;
        //var detailsCollectionUrl = serverUrl + baseUrl + detailsCollection;

        webix.ajax(collectionUrl + webix.appRoutes.columnsPath,).then(function(data){
            var columnsConfig   = data.json();
            var dataUrl         = collectionUrl + webix.appRoutes.treeOptions;

            var view      = getDataView(collectionUrl, viewId, columnsConfig, action);

            viewsContainer.addView(view);
            viewsContainer.setValue(viewId);
        });
        
    }
    
}

function getDataView(collectionUrl, viewId, columnsConfig, action) {
    
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

       url:                 collectionUrl + webix.appRoutes.treeOptions + dateRangeParams,
       bzCollectionUrl:     collectionUrl,
       bzBaseUrl:           collectionUrl + webix.appRoutes.treeOptions,

       on:{
            onItemDblClick:function(e, id, node){
                
                showItemEditor(this, e.row, false);
                

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
              {view: "button", label: webix.i18n.appStrings.action_new,      id: getSubviewId(viewId, "newElement"),      width: 150, hidden: action.readonly, 
                  click: function(id){
                        var viewId    = getViewId(id);
                        var treeTable = $$(getSubviewId(viewId, "treetable"));

                        showItemEditor(treeTable, -1, false);
                    }                      
              },
              {view: "button", label: webix.i18n.appStrings.action_edit,     id: getSubviewId(viewId, "editElement"),     width: 150, hidden: action.readonly,
                  click: function(id){
                        var viewId    = getViewId(id);
                        var treeTable = $$(getSubviewId(viewId, "treetable"));

                        var selectedItem = treeTable.getSelectedItem();

                        if (typeof selectedItem !== 'undefined'){
                            showItemEditor(treeTable, selectedItem.id, false);
                        }
                    }                      
              },
              {view: "button", label: webix.i18n.appStrings.action_copy,     id: getSubviewId(viewId, "copyElement"),     width: 150, hidden: action.readonly,
                  click: function(id){
                        var viewId    = getViewId(id);
                        var treeTable = $$(getSubviewId(viewId, "treetable"));

                        var selectedItem = treeTable.getSelectedItem();

                        if (typeof selectedItem !== 'undefined'){
                            showItemEditor(treeTable, selectedItem.id, true);
                        }
                    }                      
              },
              {view: "button", label: webix.i18n.appStrings.action_delete,   id: getSubviewId(viewId, "deleteElement"),   width: 150, hidden: !action.deletable,
                  click: function(id){
                        var viewId    = getViewId(id);
                        var treeTable = $$(getSubviewId(viewId, "treetable"));

                        var selectedItem = treeTable.getSelectedItem();

                        if (typeof selectedItem !== 'undefined'){

                          if(selectedItem.id > 0){

                            webix.confirm({
                                title:webix.i18n.appStrings.dialog_confirm,
                                ok:webix.i18n.appStrings.action_ok, 
                                cancel:webix.i18n.appStrings.action_cancel, 
                                text:webix.i18n.appStrings.dialog_delete_item
                            }).then(function(result){

                                webix.ajax()
                                  .headers({'Content-type': 'application/json;charset=UTF-8'})
                                  .del(collectionUrl + "/" + selectedItem.id, function(data) {

                                    response = JSON.parse(data);
                                    console.debug(response);

                                    refreshTreeTable(viewId);

                                  });

                            }).fail(function(){

                            });

                          }

                        }
                      
                    }                      
              },
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

////////////////////////////////////////////////
//Item editor
////////////////////////////////////////////////

function showItemEditor(treeTable, id, copy){
    
  var collectionUrl = treeTable.config.bzCollectionUrl;
  var collectionId  = getViewId(treeTable.config.id);

  webix.ajax(collectionUrl + webix.appRoutes.formPath,).then(function(data){

        var formConfig            = data.json();
        var customFormTemplate    = getFormTemplate(collectionId);

        const templateReplacer = function(item){
	  if(item.cols){
		item.cols = item.cols.map(templateReplacer);
		return item;
          } else if(item.cells){
		item.cells = item.cells.map(templateReplacer);
		return item;
          } else if(item.rows){
              item.rows = item.rows.map(templateReplacer);
              return item;
          } else if(item.body){
              if(item.body.rows){
		item.body.rows = item.body.rows.map(templateReplacer);
              }
              return item;
	  } else {
		const foundElement = formConfig.formElements.find(element => element.id === item.id);
		if(foundElement ){
			return foundElement;
		} else {
			return item;
		}
	  }
	};
        
	var customFormElementsConfig = formConfig.formElements;
        
        if(customFormTemplate.length > 0){
            customFormElementsConfig = customFormTemplate.map(templateReplacer);
        }
        
        console.debug(customFormTemplate);
        console.debug(customFormElementsConfig);
        
        var popupEditor = webix.ui({
            view:"window",
            id:"popupEdit",

            //head:"Edit.. ",
            head:{
              cols:[
                  {template: formConfig.caption, type:"header", borderless:true},
                  {view:"icon", icon:"wxi-check", id:"apply", click: function(){
                          saveItem(collectionId, collectionUrl, popupEditor);
                    }
                  },
                  {view:"icon", icon:"wxi-close", id:"close", click: function(){
                          popupEditor.close();
                    }
                  }
              ]
            },

             position:"center",
             close:true,
             fullscreen:true,
             body:{
                view:"form", id:"editform", elements: customFormElementsConfig, scroll:true , autoheight:true
             }
        });
        
        var editForm = popupEditor.getBody();

        editForm.load(collectionUrl + "/" + id, function(){

          if(copy){
              //console.debug(editForm);
              editForm.setValues({
                     id: -1
                  }, true);                
          }
          
          beforeShowForm(collectionId, editForm);

          attachEditEvents(collectionId, collectionUrl, popupEditor);

          popupEditor.show();
        });

    });

}

function getFormTemplate(collectionId){
    
    var customFormTemplate;
    
    if(collectionId === 'transactions'){
        
      customFormTemplate = [
          {  cols:[
                  {"id": "mDateTime"},
                  {"id": "mPlanned"}
              ]
          },
	  {  cols:[
		  {"id": "mCurrencyValue"},
		  {"id": "mCurrency"},
		  {"id": "mCurrencyRate"},
		  {"id": "mValue"}
		]
	  },
	  {"id": "mNote"},
          {  cols:[
                  {"id": "mAccount"},
                  {"id": "mConnectedAccount"}
              ]
          },
	  {"id": "mContractor"},
          {"id": "mLocation"},
          {"id": "splitView", 
              keepViews: true,
              animate:{
                        type:"flip",
                        subtype:"vertical"
                    },
              cells:[
                  { id:"splitViewSingle",
                    rows: [
                    {"id": "mBudgetItem"},
                    {"id": "mProject"},
                    {"id": "mUnit"},
                    { view:"button", value: webix.i18n.appStrings.action_split, click:function(){
                            
                            var editform = $$("editform");
                            var transactionDetails = $$("mTransactionDetails");
                            if(transactionDetails.count() === 0){
                                var detail = editform.getValues();
                                detail.id = - (transactionDetails.count() + 1);;
                                transactionDetails.add(detail);
                            }
                            $$("splitView").setValue("splitViewMulti");
                            
                          }
                    }
                  ]},
                  { id:"splitViewMulti",
                    rows: [
                    { view:"button", value:webix.i18n.appStrings.action_new, width: 150, click:function(){

                          webix.ajax(detailsCollectionUrl + "/-1",).then(function(data){
                              
                              var transactionDetails = $$("mTransactionDetails");
                              var detail = data.json();
                              detail.id = - (transactionDetails.count() + 1);
                              transactionDetails.add(detail);
                              
                          });
                      }

                    },
                    {"id": "mTransactionDetails"}
                  ]}
          ]},
	  ];
        
    } else {
        customFormTemplate = [];
    }
    
    return customFormTemplate;
}


function beforeShowForm(collectionId, editForm){
    
    if(collectionId === 'transactions'){
        if(editForm.elements.mTransactionDetails.count() > 1){
            $$("splitView").setValue("splitViewMulti");
        } else {
            $$("splitView").setValue("splitViewSingle");
        }
    }
}

function beforeSaveItem(collectionId, values){
    
    if(collectionId === 'transactions'){
        
        var splitPage = $$("splitView").getValue();
        console.debug(splitPage);
        if(splitPage === 'splitViewMulti'){
            if(values.mTransactionDetails.length > 1){
                values.mBudgetItem  = values.mTransactionDetails[0].mBudgetItem;
                values.mProject     = values.mTransactionDetails[0].mProject;
                values.mUnit        = values.mTransactionDetails[0].mUnit;
            }
        }
        
    }
    
}

function saveItem(collectionId, collectionUrl, popupEditor){
    
    console.debug(saveItem);
 
    var values;
    var editForm = popupEditor.getBody();

    //getDirtyValues (only modified values) not working for nested datatables
    // if(id > 0){
    //   values = $$("editform").getDirtyValues();
    //   values["id"] = id;
    // } else {
    //   values = $$("editform").getValues();
    // }
    // console.debug($$("editform").getValues());
    // console.debug($$("editform").getDirtyValues());
    values = editForm.getValues();
    
    beforeSaveItem(collectionId, values);
    
    console.debug(values);
    //console.debug(JSON.stringify(values));
    console.debug(webix.ajax().stringify(values));

    webix.ajax()
      .headers({'Content-type': 'application/json;charset=UTF-8'})
      .post(collectionUrl, webix.ajax().stringify(values), function(data) {

//        if(values.mConnectedAccount > 0){
//            refresh();
//        } else {
//            response = JSON.parse(data);
//            
//            newId = response.id;
//            webix.ajax(collectionUrl + "/" + newId,).then(function(data){
//                if(values.id > 0){
//                  $$("treetable").updateItem(values.id, data.json());
//                } else {
//                  $$("treetable").add(data.json());
//                }
//            });
//        }

        refreshTreeTable(collectionId);
        popupEditor.close();
    });
    
}

function showSuggestions(collectionUrl, popupEditor, fieldKey){

    var values;
    var editForm = popupEditor.getBody();

    values = editForm.getValues();
    console.debug(values);

    webix.ajax()
      .headers({'Content-type': 'application/json;charset=UTF-8'})
      .post(collectionUrl + webix.appRoutes.suggestionsPath  + "/" + fieldKey, webix.ajax().stringify(values), function(data) {
          
        console.debug(data);
        response = JSON.parse(data);
        console.debug(response);
          
        if(response.length > 0){

            var suggestionsWindow = webix.ui({
                view:"window",

                head:{
                  cols:[
                      {template: webix.i18n.appStrings.dialog_modify_dependend_values, type:"header", borderless:true},
                      {view:"icon", icon:"wxi-check", click: function(){
                        
                            var oldValues = editForm.getValues();
                            var newValues = {};
                            var suggestionsTree = $$("suggestionsTree");
                            suggestionsTree.eachRow( 
                                function (row){ 
                                    var item = suggestionsTree.getItem(row);
                                    if(item.mChecked){
                                        
                                        var valuesOwner;
                                        
                                        //for example: mConnectedTransaction.mDateTime
                                        if(item.ownerKey){
                                            if(! newValues[item.ownerKey]){
                                                newValues[item.ownerKey] = oldValues[item.ownerKey];
                                            }
                                            valuesOwner = newValues[item.ownerKey];
                                        } else {
                                            valuesOwner = newValues;
                                        }
                                        
                                        valuesOwner[item.value.mFieldKey] = item.value.mNewValue;
                                        
                                        console.debug(item.value.mFieldKey);
                                        console.debug(valuesOwner[item.value.mFieldKey]);
                                    }

                                }
                            );           
                    
                            editForm.setValues(newValues, true);
                            suggestionsWindow.close();

                        }
                      },
                      {view:"icon", icon:"wxi-close", click: function(){
                              suggestionsWindow.close();
                        }
                      }
                  ]
                },

                minWidth: 800,
                position:"center",
                close:true,
                move:true,
                resize:true,
                
                body:{
                    view: "treetable",
                    id: "suggestionsTree",

                    resizeColumn:true,
                    fixedRowHeight:false,
                    tooltip:true,

                    headermenu:true,
                    select:true,

                    columns: [
                        
                                {id:"mChecked", header:"",  template:"{common.checkbox()}"},
                                {id:"mName",    header:"",  template:"{common.treetable()} #mName#", fillspace: true},
                                {id:"mNewName", header:webix.i18n.appStrings.action_new,       width:200, css:{ "color":"#004D40" }},
                                {id:"mOldName", header:webix.i18n.appStrings.action_replace,   width:200}
                            ],

                    data: response,
                    
                    ready: function(){ 
                        this.openAll();
                    }
                    
                }
            });

            suggestionsWindow.show();
            suggestionsWindow.adjust();
              
        }
    });
    
}

function attachEditEvents(collectionId, collectionUrl, popupEditor){
    
    if(collectionId === 'transactions'){

        $$('mCurrencyValue').attachEvent("onChange",function(newValue, oldValue){

             var mCurrencyRate = $$('mCurrencyRate').getValue();
             $$('mValue').setValue(newValue * mCurrencyRate);

             if( (newValue > 0 && oldValue < 0) 
                     || (newValue < 0 && oldValue > 0) ){
              showSuggestions(collectionUrl, popupEditor, 'mCurrencyValue');
             }

        });

        $$('mValue').attachEvent("onChange",function(newValue, oldValue){

            var currencyValue = $$('mCurrencyValue').getValue();
            if(currencyValue !== 0){
              $$('mCurrencyRate').setValue(newValue / currencyValue);
            }

        });

        $$('mCurrencyRate').attachEvent("onChange",function(newValue, oldValue){

            var currencyValue = $$('mCurrencyValue').getValue();
            $$('mValue').setValue(newValue * currencyValue);

        });

        $$('mTransactionDetails').attachEvent("onChange",function(newValue, oldValue){

             var mCurrencyRate = $$('mCurrencyRate').getValue();
              $$('mValue').setValue(newValue * mCurrencyRate);

        });

        $$('mTransactionDetails').attachEvent("onAfterEditStop", function(state, editor, ignoreUpdate){

          if (editor.column === 'mCurrencyValue') {

            if(state.value !== state.old){
                updateCurrencyValue($$('mTransactionDetails').data);
            }
          }

        });

        $$('mAccount').attachEvent("onChange", function(newValue, oldValue, config){

          showSuggestions(collectionUrl, popupEditor, 'mAccount');

        });

        $$('mConnectedAccount').attachEvent("onChange", function(newValue, oldValue, config){

          showSuggestions(collectionUrl, popupEditor, 'mConnectedAccount');

        });

        $$('mContractor').attachEvent("onChange", function(newValue, oldValue, config){

          showSuggestions(collectionUrl, popupEditor, 'mContractor');

        });
        
        $$('mDateTime').attachEvent("onChange", function(newValue, oldValue, config){

          showSuggestions(collectionUrl, popupEditor, 'mDateTime');

        });
        
        $$('mPlanned').attachEvent("onChange", function(newValue, oldValue, config){

          showSuggestions(collectionUrl, popupEditor, 'mPlanned');

        });
        
        $$('mNote').attachEvent("onChange", function(newValue, oldValue, config){

          showSuggestions(collectionUrl, popupEditor, 'mNote');

        });
        
        
    }

}

function updateCurrencyValue(data){

  var totalCurrencyValue = 0;
  data.each(function(row){
    totalCurrencyValue += (row.mCurrencyValue);
  })

  $$('mCurrencyValue').setValue(totalCurrencyValue);

}

////////////////////////////////////////////////
//End Item editor
////////////////////////////////////////////////

