sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (Controller, JSONModel, MessageToast, MessageBox) {
    "use strict";

    return Controller.extend("com.asayar.zasayarshopbspfree.controller.Detail", {
        onInit: function () {
            const oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("RouteDetail").attachPatternMatched(this._onObjectMatched, this);

            // View Model for UI state
            const oViewModel = new JSONModel({
                editable: false
            });
            this.getView().setModel(oViewModel, "viewModel");
        },

        _onObjectMatched: function (oEvent) {
            const sOrderUuid = oEvent.getParameter("arguments").OrderUuid;
            const oModel = this.getView().getModel();
            const oViewModel = this.getView().getModel("viewModel");

            // Reset edit state
            if (sOrderUuid === "new") {
                oViewModel.setProperty("/editable", true);
            } else {
                oViewModel.setProperty("/editable", false);
            }

            oModel.metadataLoaded().then(() => {
                if (sOrderUuid === "new") {
                    // Yeni Kayıt Modu
                    // Önceki binding'i temizle ki eski veri kalmasın
                    this.getView().unbindElement();

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

        onEdit: function () {
            this.getView().getModel("viewModel").setProperty("/editable", true);
        },

        onCancel: function () {
            const oModel = this.getView().getModel();
            const oViewModel = this.getView().getModel("viewModel");

            // Discard pending changes
            if (oModel.hasPendingChanges()) {
                oModel.resetChanges();
            }

            oViewModel.setProperty("/editable", false);
            MessageToast.show("Değişiklikler iptal edildi.");
        },

        onAddItem: function () {
            const oViewModel = this.getView().getModel("viewModel");
            // Kullanıcı ekleye bastıysa edit modunu açalım
            if (!oViewModel.getProperty("/editable")) {
                oViewModel.setProperty("/editable", true);
                MessageToast.show("Düzenleme modu aktif edildi.");
            }

            const oModel = this.getView().getModel();
            const oContext = this.getView().getBindingContext(); // Header context

            if (!oContext) {
                MessageBox.error("Sipariş başlığı henüz oluşmadı.");
                return;
            }

            // Navigation Property (to_Items) üzerinden yaratıyoruz.
            // Bu sayede tablo otomatik olarak bu yeni kaydı algılar ve gösterir.
            // Navigation Adı: to_Items (Metadata'ya göre güncellendi)
            const sNavPath = oContext.getPath() + "/to_Items";

            const oProperties = {
                ProductCode: "", // Kullanıcı girmeli
                Quantity: 1,
                ItemPrice: "0.00",
                CurrencyCode: oContext.getProperty("CurrencyCode") || "TRY"
            };

            // OrderUuid varsa HeaderUuid'ye set edelim (garanti olsun)
            const sHeaderUuid = oContext.getProperty("OrderUuid");
            if (sHeaderUuid) {
                oProperties.HeaderUuid = sHeaderUuid;
            }

            const oItemContext = oModel.createEntry(sNavPath, {
                properties: oProperties,
                groupId: "changes"
            });

            MessageToast.show("Yeni satır eklendi.");
        },

        onSave: function () {
            const oModel = this.getView().getModel();
            const oViewModel = this.getView().getModel("viewModel");

            if (!oModel.hasPendingChanges()) {
                MessageToast.show("Kaydedilecek değişiklik yok.");
                oViewModel.setProperty("/editable", false);
                return;
            }

            oModel.submitChanges({
                success: (oData) => {
                    // Check for batch errors
                    if (this._hasBatchErrors(oData)) {
                        MessageBox.error("Kayıt sırasında hata oluştu. Lütfen zorunlu alanları kontrol edin.");
                    } else {
                        MessageToast.show("Başarıyla kaydedildi.");
                        oViewModel.setProperty("/editable", false);
                    }
                },
                error: (oError) => {
                    MessageBox.error("Kayıt hatası: " + oError.message);
                }
            });
        },

        _hasBatchErrors: function (oData) {
            if (oData && oData.__batchResponses) {
                return oData.__batchResponses.some(function (oResponse) {
                    return oResponse.response && oResponse.response.statusCode >= 400;
                });
            }
            return false;
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