var collection    = "/collections/budgetitems";
var treeOptions   = "?data-format=tree&nested-format=ids";
var collectionUrl = serverUrl + baseUrl + collection + treeOptions;

var viewTable = {
             view: "treetable",
             minWidth: 100,
             id: "treetable",
             resizeColumn:true,
             fixedRowHeight:false,
             //footer:true,

             tooltip:true,

             headermenu:true,

             editable:true,

             columns: [
              					{ id:"mName",	        header:"mName",         width:200, template:"{common.treetable()} #mName#", editor:"text"},
              					{ id:"mIsOutcome",	  header:"mIsOutcome" ,   width:80,  template:"{common.checkbox()}", editor:"checkbox"},
              					{ id:"mArchived",	    header:"mArchived",    	width:100, template:"{common.checkbox()}", editor:"checkbox"},
                        { id:"mBudgetType",	  header:["mBudgetType" , {content:"selectFilter"}],   width:100, editor:"richselect",
                        //options: baseUrl + "/sqlobjects/BudgetTypes"
                        options: [
                                  { "value": "10 Персональный", "id": 2 },
                                  { "value": "20 Малый бизнес", "id": 3 },
                                  { "value": "90 Универсальный", "id": 1 }
                                ]
                        }
                        // options: [
                        //             { "value":1991, "id":1 },
                        //             { "value":"90 Универсальный", "id":2 }
                        //          ]
                        // }
              				],

             //data: tabledata
             url: collectionUrl,

             save: {
                 $proxy: true,
                 save:function(view, params, dp){
                      console.debug(JSON.stringify(params.data));
                      return webix.ajax()
                        .headers({'Content-type': 'application/json;charset=UTF-8'})
                        .post(collectionUrl, JSON.stringify(params.data));
                    },
                updateFromResponse:true
              }

         };

 webix.ui({
      rows: [
        {view: "text",   label: "Server address",  id: "serverAddress",  value: serverUrl,
  				  on:{
  						onChange: function(newValue, oldValue, config){
                serverUrl     = newValue;
                collectionUrl = serverUrl + baseUrl + collection + treeOptions;

                webix.ajax(collectionUrl + columnsPath,).then(function(data){
                    var columnsConfig = data.json();
                    $$("treetable").refreshColumns(columnsConfig);

                    refresh();
                });
  						}
  					  }
  			},

        {cols:
            [
            viewTable,
            ]
        }
      ]
  });

function refresh(){
	 $$("treetable").clearAll();
    $$("treetable").load(collectionUrl);
}
