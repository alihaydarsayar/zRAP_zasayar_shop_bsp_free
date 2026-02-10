sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast"
], (Controller, MessageToast) => {
    "use strict";

    return Controller.extend("com.asayar.zasayarshopbspfree.controller.Main", {
        
        onListUpdateFinished: function(oEvent) {
            // Tablo verisi gelince satırları tıklanabilir yap
            const oTable = oEvent.getSource();
            const aItems = oTable.getItems();
            aItems.forEach((oItem) => {
                oItem.setType("Navigation");
            });
        },

        onPressItem: function(oEvent) {
            const oItem = oEvent.getParameter("listItem");
            const oContext = oItem.getBindingContext();
            const sOrderUuid = oContext.getProperty("OrderUuid"); 

            const oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("RouteDetail", {
                OrderUuid: sOrderUuid
            });
        },

        onCreate: function() {
            const oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("RouteDetail", {
                OrderUuid: "new"
            });
        }
    });
});