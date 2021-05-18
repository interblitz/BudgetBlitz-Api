var collection        = "/collections/transactions";
var detailsCollection = "/collections/transactiondetails";
var treeOptions       = "?data-format=tree&nested-format=ids";
var columnsPath       = "/webix-columns?options=true";
var formElementsPath  = "/webix-form-elements";

var collectionUrl        = serverUrl + baseUrl + collection;
var detailsCollectionUrl = serverUrl + baseUrl + detailsCollection;

webix.Date.startOnMonday = true
webix.i18n.setLocale("ru-RU");

var date = new Date();
var startDate = new Date(date.getFullYear(), date.getMonth(), 1);
var endDate   = new Date(date.getFullYear(), date.getMonth() + 1, 0);

webix.DataDriver.json.parseDates = true;

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

webix.ajax(collectionUrl + columnsPath,).then(function(data){
    var columnsConfig = data.json();

    setupUI(columnsConfig);
}, function(err){
    setupUI([]);
});

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
     view:"window",
     id:"popupEdit",
     head:"Edit.. ",
     position:"center",
     fullscreen:true,
     body:{
     	view:"form", id:"editform", elements: [], scroll:true , autoheight:true
     }
   });

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
              {view: "button", label: "New",      id: "newElement",  width: 150, click: "newElement"},
              {view: "button", label: "Delete",   id: "deleteElement",  width: 150, click: "deleteElement"},
              {view: "button", label: "Refresh",  id: "refresh",     width: 150, click: "refresh"},
              {view:"daterangepicker", label:"Range", id:"Range",  width:500,
                     value:{start:  startDate,
                            end:    endDate
                          },
                    on: {
                      onChange:function(){
                          refresh();
                      }
                    }
              }
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

function showEditor(id){

  webix.ajax(collectionUrl + formElementsPath,).then(function(data){

      var formElementsConfig = data.json();

      var customFormTemplate = [
	  {
		"id": "mDateTime"
	  },
	  {  cols:[
		  {
			"id": "mCurrencyValue"
		  },
		  {
			"id": "mCurrency"
		  },
		  {
			"id": "mCurrencyRate"
		  },
		  {
			"id": "mValue"
		  }
		]
	  },
	  {
		"id": "mNote"
	  },
	  {
		"id": "mAccount"
	  },
	  {
		"id": "mBudgetItem"
	  },
	  {
		"id": "mContractor"
	  },
	  {
		"id": "mProject"
	  },
	  {
		"id": "mUnit"
	  },
	  {
		"id": "mLocation"
	  },
	  {
		"id": "mPlanned"
	  },
      { view:"button", type:"form", value:"New", width: 150, click:function(){

          webix.ajax(detailsCollectionUrl + "/-1",).then(function(data){
            $$("mTransactionDetails").add(data.json());
          });

		}
	  },
	  {
		"id": "mTransactionDetails"
	  }
	  ];

	const templateReplacer = function(item){
	  if(item.cols){
		var nested = new Object();
		nested.cols = item.cols.map(templateReplacer);
		return nested;
	  } else {
		const foundElement = formElementsConfig.find(element => element.id === item.id);
		if(foundElement ){
			return foundElement;
		} else {
			return item;
		}
	  }
	};

	var customFormElementsConfig = customFormTemplate.map(templateReplacer);

    webix.ui(customFormElementsConfig, $$('editform'));

    $$('editform').addView(
        { view:"button", type:"form", value:"Save", click:function(){

                var values;

                //getDirtyValues (only modified values) not working for nested datatables
                // if(id > 0){
                //   values = $$("editform").getDirtyValues();
                //   values["id"] = id;
                // } else {
                //   values = $$("editform").getValues();
                // }
                // console.debug($$("editform").getValues());
                // console.debug($$("editform").getDirtyValues());
                values = $$("editform").getValues();

                console.debug(values);
                console.debug(JSON.stringify(values));

                webix.ajax()
                  .headers({'Content-type': 'application/json;charset=UTF-8'})
                  .post(collectionUrl, JSON.stringify(values), function(data) {

                    response = JSON.parse(data);
                    //console.debug(response);

                    newId = response.id;
                    webix.ajax(collectionUrl + "/" + newId,).then(function(data){
                      if(id > 0){
                        $$("treetable").updateItem(newId, data.json());
                      } else {
                        $$("treetable").add(data.json());
                      }
                    });

                });

                //this.getFormView().save();
                this.getTopParentView().hide();
              }
        }
      );

      $$('editform').load(collectionUrl + "/" + id);

      $$("popupEdit").show();

      attachEditEvents();

    }
  );

}

function newElement(){
    showEditor(-1);
}

function deleteElement(){

  var item = $$("treetable").getSelectedItem();
  console.debug(item);

  if(item.id > 0){

    webix.ajax()
      .headers({'Content-type': 'application/json;charset=UTF-8'})
      .del(collectionUrl + "/" + item.id, function(data) {

        response = JSON.parse(data);
        console.debug(response);

        if(response.status = "success"){
          $$("treetable").remove(response.id)
        } else {
          refresh();
        }

      });

  }


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
