'use strict';

var RestGateway = require('../rest-gateway'),
    _           = require('lodash'),
    HpsPayPlanPaymentMethodType = require('../../infrastructure/enums').PayPlan.HpsPayPlanPaymentMethodType;

function HpsPayPlanService(hpsConfig, enableLogging) {
    this.gateway = new RestGateway(hpsConfig, enableLogging);
}

HpsPayPlanService.prototype.page = function (limit, offset) {
    this.gateway.page(limit, offset);
    return this;
};

HpsPayPlanService.prototype.search = function (searchFields) {
    this.gateway.search(searchFields);
    return this;
};

HpsPayPlanService.prototype.addCustomer = function (customer, callback) {
    var data = getEditableFieldsWithValues('customer', customer);
    this.gateway.doRequest(
        'POST',
        '/customers',
        data,
        null,
        handleResponse(callback)
    );
    return this;
};

HpsPayPlanService.prototype.editCustomer = function (customer, callback) {
    var data = getEditableFieldsWithValues('customer', customer);
    this.gateway.doRequest(
        'PUT',
        '/customers/' + customer.customerKey,
        data,
        null,
        handleResponse(callback)
    );
    return this;
};

HpsPayPlanService.prototype.findAllCustomers = function (searchFields, callback) {
    if (!callback) {
        callback = searchFields;
        searchFields = {};
    }
    searchFields = _.pickBy(searchFields, function (value, key) {
        return -1 !== _.indexOf(getCustomerSearchableFields(), key);
    });
    this.gateway.doRequest(
        'POST',
        '/searchCustomers',
        searchFields || {},
        null,
        handleResponse(callback)
    );
    return this;
};

HpsPayPlanService.prototype.getCustomer = function (customer, callback) {
    var id = customer.customerKey || customer;
    this.gateway.doRequest(
        'GET',
        '/customers/' + id,
        null,
        null,
        handleResponse(callback)
    );
    return this;
};

HpsPayPlanService.prototype.deleteCustomer = function (customer, forceDelete, callback) {
    var id = customer.customerKey || customer;
    if (!callback) {
        callback = forceDelete;
        forceDelete = false;
    }

    this.gateway.doRequest(
        'DELETE',
        '/customers/' + id,
        {forceDelete: forceDelete},
        null,
        handleResponse(callback)
    );
    return this;
};

HpsPayPlanService.prototype.addPaymentMethod = function (paymentMethod, callback) {
    var endpoint;
    var data = getEditableFieldsWithValues('paymentMethod', paymentMethod);
    paymentMethod && (data.customerKey = paymentMethod.customerKey);
    if (paymentMethod && paymentMethod.paymentMethodType === HpsPayPlanPaymentMethodType.Ach) {
        endpoint = '/paymentMethodsACH';
        data.accountNumber = paymentMethod.accountNumber;
        data.accountType = paymentMethod.accountType;
        data.achType = paymentMethod.achType;
        data.routingNumber = paymentMethod.routingNumber;
    } else if (paymentMethod) {
        endpoint = '/paymentMethodsCreditCard';
        if (paymentMethod.accountNumber) {
            data.accountNumber = paymentMethod.accountNumber;
        } else if (paymentMethod.paymentToken) {
            data.paymentToken = paymentMethod.paymentToken;
        }
    }

    this.gateway.doRequest(
        'POST',
        endpoint,
        data,
        null,
        handleResponse(callback)
    );
    return this;
};

HpsPayPlanService.prototype.editPaymentMethod = function (paymentMethod, callback) {
    var data = getEditableFieldsWithValues('paymentMethod', paymentMethod);
    var endpointBase = paymentMethod.paymentMethodType === HpsPayPlanPaymentMethodType.Ach
        ? '/paymentMethodsACH/'
        : '/paymentMethodsCreditCard/';
    this.gateway.doRequest(
        'PUT',
        endpointBase + paymentMethod.paymentMethodKey,
        data,
        null,
        handleResponse(callback)
    );
    return this;
};

HpsPayPlanService.prototype.findAllPaymentMethods = function (searchFields, callback) {
    if (!callback) {
        callback = searchFields;
        searchFields = {};
    }
    searchFields = _.pickBy(searchFields, function (value, key) {
        return -1 !== _.indexOf(getPaymentMethodSearchableFields(), key);
    });
    this.gateway.doRequest(
        'POST',
        '/searchPaymentMethods',
        searchFields || {},
        null,
        handleResponse(callback)
    );
    return this;
};

HpsPayPlanService.prototype.getPaymentMethod = function (paymentMethod, callback) {
    var id = paymentMethod.paymentMethodKey || paymentMethod;
    this.gateway.doRequest(
        'GET',
        '/paymentMethods/' + id,
        null,
        null,
        handleResponse(callback)
    );
    return this;
};

HpsPayPlanService.prototype.deletePaymentMethod = function (paymentMethod, forceDelete, callback) {
    var id = paymentMethod.paymentMethodKey || paymentMethod;
    if (!callback) {
        callback = forceDelete;
        forceDelete = false;
    }

    this.gateway.doRequest(
        'DELETE',
        '/paymentMethods/' + id,
        {forceDelete: forceDelete},
        null,
        handleResponse(callback)
    );
    return this;
};

HpsPayPlanService.prototype.addSchedule = function (schedule, callback) {
    var data = getEditableFieldsWithValues('schedule', schedule);
    if (schedule) {
        data.customerKey = schedule.customerKey;
        data.numberOfPayments = schedule.numberOfPayments;
    }
    this.gateway.doRequest(
        'POST',
        '/schedules',
        data,
        null,
        handleResponse(callback)
    );
    return this;
};

HpsPayPlanService.prototype.editSchedule = function (schedule, callback) {
    var data = getEditableFieldsWithValues('schedule', schedule);
    this.gateway.doRequest(
        'PUT',
        '/schedules/' + schedule.scheduleKey,
        data,
        null,
        handleResponse(callback)
    );
    return this;
};

HpsPayPlanService.prototype.findAllSchedules = function (searchFields, callback) {
    if (!callback) {
        callback = searchFields;
        searchFields = {};
    }
    searchFields = _.pickBy(searchFields, function (value, key) {
        return -1 !== _.indexOf(getScheduleSearchableFields(), key);
    });
    this.gateway.doRequest(
        'POST',
        '/searchSchedules',
        searchFields || {},
        null,
        handleResponse(callback)
    );
    return this;
};

HpsPayPlanService.prototype.getSchedule = function (schedule, callback) {
    var id = schedule.scheduleKey || schedule;
    this.gateway.doRequest(
        'GET',
        '/schedules/' + id,
        null,
        null,
        handleResponse(callback)
    );
    return this;
};

HpsPayPlanService.prototype.deleteSchedule = function (schedule, forceDelete, callback) {
    var id = schedule.scheduleKey || schedule;
    if (!callback) {
        callback = forceDelete;
        forceDelete = false;
    }

    this.gateway.doRequest(
        'DELETE',
        '/schedules/' + id,
        {forceDelete: forceDelete},
        null,
        handleResponse(callback)
    );
    return this;
};

function handleResponse(callback) {
    return function (err, result) {
        if (err) {
            callback(err, null);
            return;
        }

        callback(null, hydrateResult(result));
    };
}

function getEditableFieldsWithValues(type, object) {
    if (!object) {
        return object;
    }

    var allowed;
    switch (type) {
        case 'customer':
            allowed = getCustomerEditableFields();
            break;
        case 'paymentMethod':
            allowed = getPaymentMethodEditableFields(object);
            break;
        case 'schedule':
            allowed = getScheduleEditableFields(object);
            break;
    }

    return _.pickBy(object, function (value, key) {
        return -1 !== _.indexOf(allowed, key)
            && !!value;
    });
}

function hydrateResult(result) {
    return _.pickBy(result, function (value, key) {
        return 'links' !== key;
    });
}

function getCustomerEditableFields(customer) {
    return [
        'customerIdentifier',
        'firstName',
        'lastName',
        'company',
        'customerStatus',
        'title',
        'department',
        'primaryEmail',
        'secondaryEmail',
        'phoneDay',
        'phoneDayExt',
        'phoneEvening',
        'phoneEveningExt',
        'phoneMobile',
        'phoneMobileExt',
        'fax',
        'addressLine1',
        'addressLine2',
        'city',
        'stateProvince',
        'zipPostalCode',
        'country'
    ];
}

function getCustomerSearchableFields() {
    return [
        'customerIdentifier',
        'company',
        'firstName',
        'lastName',
        'primaryEmail',
        'customerStatus',
        'phoneNumber',
        'city',
        'stateProvince',
        'zipPostalCode',
        'country',
        'hasSchedules',
        'hasActiveSchedules',
        'hasPaymentMethods',
        'hasActivePaymentMethods'
    ];
}

function getPaymentMethodEditableFields(paymentMethod) {
    var fields = [
        'preferredPayment',
        'paymentStatus',
        'paymentMethodIdentifier',
        'nameOnAccount',
        'addressLine1',
        'addressLine2',
        'city',
        'stateProvince',
        'zipPostalCode',
    ];

    var ccOnly = [
        'expirationDate',
        'country',
    ];

    var achOnly = [
        'telephoneIndicator',
        'accountHolderYob',
        'driversLicenseState',
        'driversLicenseNumber',
        'socialSecurityNumberLast4',
    ];

    switch (paymentMethod.paymentMethodType) {
        case HpsPayPlanPaymentMethodType.Ach:
            return _.uniq(_.union(fields, achOnly));
        case HpsPayPlanPaymentMethodType.CreditCard:
            return _.uniq(_.union(fields, ccOnly));
        default:
            return _.uniq(_.union(fields, achOnly, ccOnly));
    }
}

function getPaymentMethodSearchableFields() {
    return [
        'customerIdentifier',
        'achType',
        'accountType',
        'accountNumberLast4',
        'routingNumber',
        'cardBrand',
        'cardBINNumber',
        'expirationDateStart',
        'expirationDateEnd',
        'paymentMethodType',
        'paymentStatus',
        'hasSchedules',
        'hasActiveSchedules'
    ];
}

function getScheduleEditableFields(schedule) {
    var fields = [
        'scheduleName',
        'scheduleStatus',
        'deviceId',
        'paymentMethodKey',
        'subtotalAmount',
        'taxAmount',
        'numberOfPaymentsRemaining',
        'endDate',
        'reprocessingCount',
        'emailReceipt',
        'emailAdvanceNotice',
        'processingDateInfo',
        'invoiceNbr',
        'description'
    ];
    if (schedule.scheduleStarted) {
        fields.push('cancellationDate');
        fields.push('nextProcessingDate');
    }
    // Only editable when scheduleStarted = false
    else {
        fields.push('scheduleIdentifier');
        fields.push('startDate');
        fields.push('frequency');
        fields.push('duration');
    }
    return  fields;
}

function getScheduleSearchableFields() {
    return [
        'scheduleIdentifier',
        'scheduleName',
        'deviceIdFilter',
        'deviceName',
        'customerIdentifier',
        'customerKey',
        'lastname',
        'company',
        'paymentMethodType',
        'paymentMethodKey',
        'achType',
        'accountType',
        'cardBrand',
        'totalAmount',
        'startDate',
        'previousProcessingDate',
        'nextProcessingDate',
        'frequency',
        'duration',
        'scheduleStatus'
    ];
}

module.exports = HpsPayPlanService;
