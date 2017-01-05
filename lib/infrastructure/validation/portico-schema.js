'use strict';

var st,     // Simple Types
    ct,     // Complex Types
    rt;     // Request Types

st = {
    stringType: {
        type: 'string'
    },
    booleanType: {
        type: 'string',
        enum: ['Y','N']
    },
    dateTimeType : {
        type: 'string',
        pattern: '([0-9]{4})-([0-9]{2})-([0-9]{2})T(([0-9]{2}):([0-9]{2}):([0-9]{2}))\.([0-9]{0,3})Z'
    },
    guidType: {
        type: 'string',
        pattern: '[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}'
    },
    monthType: {
        type: 'number',
        minimum: 1,
        maximum: 12,
        exclusiveMinimum: false,
        exclusiveMaximum: false
    },
    yearType: {
        type: 'number'
    },
    cardNbrType: {
        type: 'string',
        maxLength: 22
    },
    cvv2Type: {
        type: 'string',
        maxLength: 6
    },
    cvv2Status: {
        type: 'string',
        enum: ['ILLEGIBLE', 'NOTPRESENT']
    },
    trackDataType: {
        type: 'string'
    },
    batchIdType : {
        type: 'number',
        minimum: 0,
        exclusiveMinimum: true
    },
    clerkIdType : {
        type: 'string',
        maxLength: 50
    },
    deviceIdType : {
        type: 'number',
        minimum: 0,
        exclusiveMinimum: true
    },
    clientIdType : {
        type: 'number'
    },
    tzConversionType : {
        type: 'string',
        enum: ['Merchant', 'UTC', 'Datacenter']
    },
    batchSeqNbrType: {
        type: 'number',
        minimum: 0,
        exclusiveMinimum: true
    },
    txnIdType: {
        type: 'number',
        minimum: 0,
        exclusiveMinimum: true
    },
    amtType: {
        type: 'number',
        minimum: 0,
        exclusiveMinimum: false
    },
    currencyType: {
        type: 'string',
        enum: ['usd']
    },
    eCommerceType: {
        type: 'string',
        enum: ['ECOM', 'MOTO']
    },
    tokenMappingType: {
        type: 'string',
        enum: ['UNIQUE', 'CONSTANT']
    },
    encryptionVersionType: {
        type: 'string',
        maxLength: 2
    },
    encryptedTrackNumberType: {
        type: 'string',
        maxLength: 1
    },
    emvTagDataType: {
        type: 'string',
        maxLength: 1024
    },
    encryptionKTBType: {
        type: 'string',
        maxLength: 304
    },
    encryptionKSNType: {
        type: 'string',
        maxLength: 128
    },
    firstNameType: {
        type: 'string',
        maxLength: 26
    },
    lastNameType: {
        type: 'string',
        maxLength: 26
    },
    addrType: {
        type: 'string'
    },
    cityType: {
        type: 'string',
        maxLength: 20
    },
    stateType: {
        type: 'string',
        maxLength: 26
    },
    zipType: {
        type: 'string',
        maxLength: 9,
        pattern: '^[0-9A-Za-z]*'
    },
    phoneType: {
        type: 'string',
        maxLength: 20,
        pattern: '^[0-9]*'
    },
    emailType: {
        type: 'string',
        maxLength: 40
    },
    descriptionType : {
        type: 'string',
        maxLength: 250
    },
    customerIdType : {
        type: 'string',
        maxLength: 50
    }
};



ct = { };

ct.CardDataDetailsType = {  // This type is not a defined ComplexType in the Portico Docs... It probably should be
    type: 'object',
    properties: {
        'CardNbr':              st.cardNbrType,
        'ExpMonth':             st.monthType,
        'ExpYear':              st.yearType,
        'CardPresent':          st.booleanType,
        'ReaderPresent':        st.booleanType,
        'CVV2':                 st.cvv2Type,
        'CVV2Status':           st.cvv2Status,
        'TokenValue':           st.stringType
    }
};

ct.CardHolderDataType = {
    type: 'object',
    properties: {
        'CardHolderFirstName':  st.firstNameType,
        'CardHolderLastName':   st.lastNameType,
        'CardHolderAddr':       st.addrType,
        'CardHolderCity':       st.cityType,
        'CardHolderState':      st.stateType,
        'CardHolderZip':        st.zipType,
        'CardHolderPhone':      st.phoneType,
        'CardHolderEmail':      st.emailType,
    }
};

ct.AdditionalTxnFieldsType = {
    type: 'object',
    properties: {
        'Description':          st.descriptionType,
        'InvoiceNbr':           st.stringType,
        'CustomerId':           st.customerIdType
    }
};

ct.PaymentMethodKeyData = {
    type: 'object',
    properties: {
        'ExpMonth':             st.monthType,
        'ExpYear':              st.yearType,
        'CVV2':                 st.cvv2Type,
        'CVV2Status':           st.cvv2Status
    }
};

ct.TokenParametersType = {
    type: 'object',
    properties: {
        'Mapping':              st.tokenMappingType
    }
};

ct.EncryptionDataType = {
    type: 'object',
    properties: {
        'Version':              st.encryptionVersionType,
        'EncryptedTrackNumber': st.encryptedTrackNumberType,
        'KTB':                  st.encryptionKTBType,
        'KSN':                  st.encryptionKSNType
    }
};

ct.CardDataType = {
    type: 'object',
    properties: {
        'TrackData':            st.trackDataType,
        'ManualEntry':          ct.CardDataDetailsType,
        'TokenData':            ct.CardDataDetailsType,
        'EncryptionData':       ct.EncryptionDataType,
        'TokenRequest':         st.booleanType,
        'TokenParameters':      ct.TokenParametersType
    }
};

ct.TokenActions = {
    type: 'object',
    properties: {
        'Set':                  ct.Set
    }
};

ct.Set = {
    type: 'object',
    properties: {
        'Attribute':            ct.Attribute
    }
};

ct.Attribute = {
    type: 'object',
    properties: {
        'Name':                 st.stringType,
        'Value':                st.stringType
    }
};


rt = {
    CreditSale : {
        type: 'object',
        properties: {
            'GatewayTxnId':         st.txnIdType,
            'CardData':             ct.CardDataType,
            'Amt':                  st.amtType,
            'GratuityAmtInfo':      st.amtType,
            'CPCReq':               st.booleanType,
            'CardHolderData':       ct.CardHolderDataType,
            // 'DirectMktData':         ct.DirectMktDataType,
            'AllowDup':             st.booleanType,
            // 'LodgingData':           ct.LodgingDataType,
            // 'AutoSubstantiation':    ct.AutoSubstantiationType,
            'AllowPartialAuth':     st.booleanType,
            'Ecommerce':            st.eCommerceType,
            'AdditionalTxnFields':  ct.AdditionalTxnFieldsType,
            // 'OrigTxnRefData':        ct.OrigTxnRefDataType,
            'ConvenienceAmtInfo':   st.amtType,
            'ShippingAmtInfo':      st.amtType,
            'TxnDescriptor':        st.stringType,
            'SurchargeAmtInfo':     st.amtType,
            // 'EMVData':               ct.EMVDataType,
            // 'SecureECommerce':       ct.SecureECommerceType
        }
    },

    CreditAuth : {
        type: 'object',
        properties: {
            'GatewayTxnId':         st.txnIdType,
            'CardData':             ct.CardDataType,
            'Amt':                  st.amtType,
            'GratuityAmtInfo':      st.amtType,
            'CPCReq':               st.booleanType,
            'CardHolderData':       ct.CardHolderDataType,
            // 'DirectMktData':         ct.DirectMktDataType,
            'AllowDup':             st.booleanType,
            // 'LodgingData':           ct.LodgingDataType,
            // 'AutoSubstantiation':    ct.AutoSubstantiationType,
            'AllowPartialAuth':     st.booleanType,
            'Ecommerce':            st.eCommerceType,
            'AdditionalTxnFields':  ct.AdditionalTxnFieldsType,
            // 'OrigTxnRefData':        ct.OrigTxnRefDataType,
            'ConvenienceAmtInfo':   st.amtType,
            'ShippingAmtInfo':      st.amtType,
            'TxnDescriptor':        st.stringType,
            'SurchargeAmtInfo':     st.amtType,
            // 'EMVData':               ct.EMVDataType,
            // 'SecureECommerce':       ct.SecureECommerceType,
            'PaymentMethodKey':     st.guidType,
            'PaymentMethodKeyData': ct.PaymentMethodKeyData
        }
    },

    CreditAccountVerify : {
        type: 'object',
        properties: {
            'CardData':             ct.CardDataType,
            'CardHolderData':       ct.CardHolderDataType,
            'PaymentMethodKey':     st.guidType,
            'PaymentMethodKeyData': ct.PaymentMethodKeyData,
            // 'EMVData':               ct.EMVDataType,
            'CPCReq':               st.booleanType
        }
    },

    CreditAddToBatch : {
        type: 'object',
        properties: {
            'GatewayTxnId':         st.txnIdType,
            'Amt':                  st.amtType,
            'GratuityAmtInfo':      st.amtType,
            // 'LodgingDataEdit':   ct.LodgingDataEditType,
            // 'DirectMktData':     ct.DirectMktDataType,
            'SurchargeAmtInfo':     st.amtType,
            'EMVTagData':           st.emvTagDataType,
        }
    },

    CreditReturn : {
        type: 'object',
        properties: {
            'GatewayTxnId':         st.txnIdType,
            'CardData':             ct.CardDataType,
            'Amt':                  st.amtType,
            'CardHolderData':       ct.CardHolderDataType,
            // 'DirectMktData':         ct.DirectMktDataType,
            'AllowDup':             st.booleanType,
            'Ecommerce':            st.eCommerceType,
            'AdditionalTxnFields':  ct.AdditionalTxnFieldsType,
            'SurchargeAmtInfo':     st.amtType
            //, 'EMVData':              ct.EMVDataType
        }
    },

    CreditReversal : {
        type: 'object',
        properties: {
            'GatewayTxnId':         st.txnIdType,
            'CardData':             ct.CardDataType,
            'Amt':                  st.amtType,
            'AuthAmt':              st.amtType,
            'Ecommerce':            st.eCommerceType,
            'AdditionalTxnFields':  ct.AdditionalTxnFieldsType,
            'ClientTxnId':          st.clientIdType,
            'EMVTagData':           st.emvTagDataType
        }
    },

    ReportActivity : {
        type: 'object',
        properties: {
            'RptStartUtcDT':        st.dateTimeType,
            'RptEndUtcDT':          st.dateTimeType,
            'DeviceId':             st.deviceIdType,
            'TzConversion':         st.tzConversionType
        }
    },

    ReportBatchDetail : {
        type: 'object',
        properties: {
            'BatchId':              st.batchIdType,
            'TzConversion':         st.tzConversionType
        }
    },

    ReportBatchHistory : {
        type: 'object',
        properties: {
            'RptStartUtcDT':        st.dateTimeType,
            'RptEndUtcDT':          st.dateTimeType,
            'DeviceId':             st.deviceIdType,
            'TzConversion':         st.tzoneConversionType
        }
    },

    ReportBatchSummary : {
        type: 'object',
        properties: {
            'BatchId':              st.batchIdType,
            'RptStartUtcDT':        st.dateTimeType,
            'RptEndUtcDT':          st.dateTimeType,
            'BatchSeqNbr':          st.batchSeqNbrType,
            'ClerkId':              st.clerkIdType
        }
    },

    ReportOpenAuths : {
        type: 'object',
        properties: {
            'DeviceId':             st.deviceIdType,
            'TzConversion':         st.tzoneConversionType
        }
    },

    ReportTxnDetail : {
        type: 'object',
        properties: {
            'TxnId':                st.txnIdType,
            'TzConversion':         st.tzConversionType
        }
    },

    ManageTokens: {
        type: 'object',
        properties: {
            'TokenActions':         ct.TokenActions
        }
    }
};

module.exports = {
    // Deep cloning of JavaScript schema objects allows fine-tuning from within
    // services without affecting the underlying objects here. (simplifies reuse)
    simpleType:  function (type) { return JSON.parse(JSON.stringify(st[type])); },
    complexType: function (type) { return JSON.parse(JSON.stringify(ct[type])); },
    requestType: function (type) { return JSON.parse(JSON.stringify(rt[type])); }
};
