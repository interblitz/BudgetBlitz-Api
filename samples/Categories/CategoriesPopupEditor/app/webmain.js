var collection        = "/collections/budgetitems";
var treeOptions       = "?data-format=tree&nested-format=ids";
var columnsPath       = "/webix-columns?options=true";
var formElementsPath  = "/webix-form-elements";

var collectionUrl     = serverUrl + baseUrl + collection;

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

webix.ajax(collectionUrl + columnsPath,).then(function(data){
    var columnsConfig = data.json();

    setupUI(columnsConfig);
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

       url: collectionUrl + treeOptions,

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
                  collectionUrl = serverUrl + baseUrl + collection;

    						  refresh();
    						}
    					  }
    			},
					{ view: "toolbar",
            elements: [
              {view: "button", label: "New",      id: "newElement",  width: 150, click: "newElement"},
              {view: "button", label: "Refresh",  id: "refresh",     width: 150, click: "refresh"}
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
      webix.ui(formElementsConfig, $$('editform'));

      $$('editform').addView(
        { view:"button", type:"form", value:"Save", click:function(){

                //webix.ajax().post(baseUrl + "/sqlobjects/Transaction", JSON.stringify(params.data));
                var values;
                if(id > 0){
                  values = $$("editform").getDirtyValues();
                  values["id"] = id;
                } else {
                  values = $$("editform").getValues();
                }

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
    }
  );

}

function newElement(){
    showEditor(-1);
}

function refresh(){
 	 $$("treetable").clearAll();
    $$("treetable").load(collectionUrl + treeOptions);
}
