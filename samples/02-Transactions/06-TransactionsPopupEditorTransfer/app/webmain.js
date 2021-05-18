var collection        = "/collections/transactions";
var detailsCollection = "/collections/transactiondetails";
var treeOptions       = "?data-format=tree&nested-format=ids";
var columnsPath       = "/webix-columns?options=true";
var formPath          = "/webix-form";

var collectionUrl        = serverUrl + baseUrl + collection;
var detailsCollectionUrl = serverUrl + baseUrl + detailsCollection;

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

var requestLocale   = webix.ajax(serverUrl + baseUrl + "/resources/strings/locale");
var requestStrings  = webix.ajax(serverUrl + baseUrl + "/resources/strings");
var requestColumns = webix.ajax(collectionUrl + columnsPath);
 
webix.promise.all([requestLocale,requestStrings,requestColumns]).then(function(results){
    var responseLocale  = results[0];
    var responseStrings = results[1];
    var responseColumns = results[2];
    
    ///////////////////////////////////
    var locale = responseLocale.json();

    webix.Date.startOnMonday = (locale.firstDayOfWeek == 2);
    webix.i18n.setLocale(locale.locale);
    ///////////////////////////////////
    
    ///////////////////////////////////
    webix.i18n.appStrings = responseStrings.json();
    ///////////////////////////////////
    
    var columnsConfig = responseColumns.json();

    setupUI(columnsConfig);
    
}, function(err){
    setupUI([]);
});

//webix.ajax(collectionUrl + columnsPath,).then(function(data){
//    var columnsConfig = data.json();
//
//    setupUI(columnsConfig);
//}, function(err){
//    setupUI([]);
//});

function setupUI(columnsConfig) {

  var viewTable = {
       view: "treetable",
       minWidth: 100,
       id: "treetable",

       resizeColumn:true,
       fixedRowHeight:false,
       tooltip:true,

       headermenu:true,
       select:true,

       columns: columnsConfig,

       url: collectionUrl + treeOptions + getRangeParams(startDate, endDate),

       on:{
        	onItemDblClick:function(e, id, node){

            console.debug(JSON.stringify(e));
            console.debug(JSON.stringify(id));
            console.debug(JSON.stringify(node));

            showEditor(e.row);
          }
        }

   };

   webix.ui({
        rows: [
          {view: "text",   label: "Server address",  id: "serverAddress",  value: serverUrl,
    				  on:{
    						onChange: function(newValue, oldValue, config){
                  serverUrl             = newValue;
                  collectionUrl         = serverUrl + baseUrl + collection;
                  detailsCollectionUrl  = serverUrl + baseUrl + detailsCollection;

                  webix.ajax(collectionUrl + columnsPath,).then(function(data){
                      var columnsConfig = data.json();
                      $$("treetable").refreshColumns(columnsConfig);

                      refresh();
                  });
    						}
    					  }
    			},
          { view: "toolbar",
            elements: [
              {view: "button", label: webix.i18n.appStrings.action_new,      id: "newElement",  width: 150, click: "newElement"},
              {view: "button", label: webix.i18n.appStrings.action_edit,     id: "editElement",  width: 150, click: "editElement"},
              {view: "button", label: webix.i18n.appStrings.action_copy,     id: "copyElement",  width: 150, click: "copyElement"},
              {view: "button", label: webix.i18n.appStrings.action_delete,   id: "deleteElement",  width: 150, click: "deleteElement"},
              {view:"daterangepicker", label:webix.i18n.appStrings.action_range, id:"Range",  width:500,
                     value:{start:  startDate,
                            end:    endDate
                          },
                    on: {
                      onChange:function(){
                          refresh();
                      }
                    }
              },
              {view:"icon", icon:"wxi-sync",  id: "refresh",  click: "refresh"}
            ]
          },
          {cols:
              [
              viewTable,
              ]
          }
        ]
    });

}

function showEditor(id, copy){

  webix.ajax(collectionUrl + formPath,).then(function(data){

      var formConfig = data.json();

      var customFormTemplate = [
	  {"id": "mDateTime"},
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
	  {"id": "mBudgetItem"},
	  {"id": "mContractor"},
	  {"id": "mProject"},
	  {"id": "mUnit"},
	  {"id": "mLocation"},
	  {"id": "mPlanned"},
          
          { view:"button", type:"form", value:webix.i18n.appStrings.action_new, width: 150, click:function(){

                webix.ajax(detailsCollectionUrl + "/-1",).then(function(data){
                  $$("mTransactionDetails").add(data.json());
                });
            }
            
	  },
	  {"id": "mTransactionDetails"}
	  ];

	const templateReplacer = function(item){
	  if(item.cols){
		var nested = new Object();
		nested.cols = item.cols.map(templateReplacer);
		return nested;
	  } else {
		const foundElement = formConfig.formElements.find(element => element.id === item.id);
		if(foundElement ){
			return foundElement;
		} else {
			return item;
		}
	  }
	};

	var customFormElementsConfig = customFormTemplate.map(templateReplacer);
        
        var popupEditor = webix.ui({
            view:"window",
            id:"popupEdit",

            //head:"Edit.. ",
            head:{
              cols:[
                  {template: formConfig.caption, type:"header", borderless:true},
                  {view:"icon", icon:"wxi-check", id:"apply", click: function(){
                          saveElement(popupEditor);
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
                view:"form", id:"editform", elements: [], scroll:true , autoheight:true
             }
        });
        
        var editForm = popupEditor.getBody();//$$('editform');
        webix.ui(customFormElementsConfig, editForm);

        editForm.addView(
            { view:"button", type:"form", value:webix.i18n.appStrings.action_ok, click:function(){
                    saveElement(popupEditor);
                }
            }
          );

          editForm.load(collectionUrl + "/" + id, function(){

            if(copy){
                //console.debug(editForm);
                editForm.setValues({
                       id: -1
                    }, true);                
            }
              
          });

          popupEditor.show();

          attachEditEvents();

        }
      );

}

function newElement(){
    showEditor(-1, false);
}

function editElement(){
    var selectedItem = $$("treetable").getSelectedItem();
    
    if (typeof selectedItem !== 'undefined'){
        showEditor(selectedItem.id, false);
    }
}

function copyElement(){

    var selectedItem = $$("treetable").getSelectedItem();
    
    if (typeof selectedItem !== 'undefined'){
        showEditor(selectedItem.id, true);
    }
    
}

function deleteElement(){

  var selectedItem = $$("treetable").getSelectedItem();
  console.debug(selectedItem);

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

              if(selectedItem.mConnectedAccount > 0){
                  refresh();
              } else {
                if(response.status = "success"){
                  $$("treetable").remove(response.id)
                } else {
                  refresh();
                }
              }

            });

      }).fail(function(){

      });

    }
        
  }

}

function saveElement(popupEditor){

    var values;
    var editForm = popupEditor.getBody();//$$("editform")

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

    console.debug(values);
    console.debug(JSON.stringify(values));

    webix.ajax()
      .headers({'Content-type': 'application/json;charset=UTF-8'})
      .post(collectionUrl, JSON.stringify(values), function(data) {
          
        if(values.mConnectedAccount > 0){
            refresh();
        } else {
            response = JSON.parse(data);
            
            newId = response.id;
            webix.ajax(collectionUrl + "/" + newId,).then(function(data){
                if(values.id > 0){
                  $$("treetable").updateItem(values.id, data.json());
                } else {
                  $$("treetable").add(data.json());
                }
            });
        }

        popupEditor.close();
    });
    
}

function refresh(){
  $$("treetable").clearAll();
  $$("treetable").load(collectionUrl + treeOptions + getRangeParams($$("Range").getValue().start, $$("Range").getValue().end) );
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

function attachEditEvents(){

  $$('mCurrencyValue').attachEvent("onChange",function(newValue, oldValue){

       var mCurrencyRate = $$('mCurrencyRate').getValue();
        $$('mValue').setValue(newValue * mCurrencyRate);

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

      if(state.value != state.old){
          updateCurrencyValue($$('mTransactionDetails').data);
      }
    }

  });

}

function updateCurrencyValue(data){

  var totalCurrencyValue = 0;
  data.each(function(row){
    totalCurrencyValue += (row.mCurrencyValue);
  })

  $$('mCurrencyValue').setValue(totalCurrencyValue);

}
