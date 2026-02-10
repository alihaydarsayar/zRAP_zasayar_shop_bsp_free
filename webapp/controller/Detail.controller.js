sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (Controller, MessageToast, MessageBox) {
    "use strict";

    return Controller.extend("com.asayar.zasayarshopbspfree.controller.Detail", {
        onInit: function () {
            const oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("RouteDetail").attachPatternMatched(this._onObjectMatched, this);
        },

        _onObjectMatched: function (oEvent) {
            const sOrderUuid = oEvent.getParameter("arguments").OrderUuid;
            const oModel = this.getView().getModel();

            oModel.metadataLoaded().then(() => {
                if (sOrderUuid === "new") {
                    // Yeni Kayıt Modu
                    const oContext = oModel.createEntry("/online_shop", {
                        properties: {
                            CurrencyCode: "TRY",
                            OrderStatus: "Yeni" // Başlangıç değeri
                        }
                    });
                    this.getView().setBindingContext(oContext);
                } else {
                    // Düzenleme Modu
                    // Key: OrderUuid=guid'...'
                    const sPath = "/online_shop(OrderUuid=guid'" + sOrderUuid + "')";
                    this.getView().bindElement({
                        path: sPath,
                        events: {
                            dataRequested: () => this.getView().setBusy(true),
                            dataReceived: () => this.getView().setBusy(false)
                        }
                    });
                }
            });
        },

        onSave: function () {
            const oModel = this.getView().getModel();
            if (oModel.hasPendingChanges()) {
                oModel.submitChanges({
                    success: () => MessageToast.show("Kayıt Başarılı"),
                    error: () => MessageBox.error("Kayıt Hatası")
                });
            } else {
                MessageToast.show("Değişiklik yok.");
            }
        },

        onBesiktas: function () {
            this._callAction("ASAYAR_TEST_BUTTON", "Beşiktaş");
        },

        onJohnLennon: function () {
            this._callAction("ASAYAR_TEST_BUTTON2", "John Lennon");
        },

        _callAction: function (sActionName, sLabel) {
            const oModel = this.getView().getModel();
            const oContext = this.getView().getBindingContext();

            // Action parametreleri için binding context'ten veriyi alalım
            // RAP action'ları genellikle instance-bound ise key gerektirir.
            // OData V2 function import olarak çağrıldığında parametre olarak geçeriz.

            if (!oContext) {
                MessageBox.error("Bağlam bulunamadı.");
                return;
            }

            const sOrderUuid = oContext.getProperty("OrderUuid");

            oModel.callFunction("/" + sActionName, {
                method: "POST",
                urlParameters: {
                    OrderUuid: sOrderUuid
                },
                success: () => MessageToast.show(sLabel + " işlemi başarılı."),
                error: (oError) => {
                    let sMsg = "İşlem Hatası";
                    try {
                        const oResp = JSON.parse(oError.responseText);
                        sMsg = oResp.error.message.value || sMsg;
                    } catch (e) { /* ignore */ }
                    MessageBox.error(sMsg);
                }
            });
        }
    });
});