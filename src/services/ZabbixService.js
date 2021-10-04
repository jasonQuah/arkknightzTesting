import axios from 'axios';
import Config from "../config.json";

const url = Config.REACT_APP_ZABBIX_URL +"/api_jsonrpc.php";

const login = (loginData, headers) => {
    console.log(loginData)
    const data = {
        "jsonrpc": "2.0",
        "method": "user.login",
        "params": {
            "user": loginData.username,
            "password": loginData.password
        },
        "id": 1,
        "auth": null
    };

    headers = headers === undefined ? {
        "content-type": "application/json"
    } : headers;

    return axios.post(url, data, { headers })
};

const getAllHost = (loginData) => {
    const data = {
        "jsonrpc": "2.0",
        "method": "host.get",
        "params": {
            "search": {
                "host": ""
            },
            "output": ["hostid", "host"],
            "searchByAny": true
        },
        "id": 1,
        "auth": loginData.auth
    };

    const headers = {
        "content-type": "application/json"
    };

    return axios.post(url, data, { headers })
};

const getAllItems = (loginData, listOfSearchHost) => {
    const data = {
        "jsonrpc": "2.0",
        "method": "item.get",
        "params": {
            "output": ["itemid", "name", "hostid", "key_", "prevvalue", "lastvalue"],
            "hostids": listOfSearchHost,
            "search": {
                "key_": ["rabbitmq.queue.messages[", "rabbitmq.overview.queue_totals.messages"]
            },
            "searchByAny": true
        },
        "id": 1,
        "auth": loginData.auth
    };

    const headers = {
        "content-type": "application/json"
    };

    return axios.post(url, data, { headers })
};

const getAllApplications = (loginData, listOfSearchHost) => {
    const data = {
        "jsonrpc": "2.0",
        "method": "item.get",
        "params": {
            "output": ["itemid", "name", "hostid", "key_", "lastvalue", "prevvalue"],
            "hostids": listOfSearchHost,
            "search": {
                "name": ["RabbitMQ: Exchange ", "RabbitMQ: Queue "]
            },
            "excludeSearch": true,
        },
        "id": 1,
        "auth": loginData.auth
    };

    const headers = {
        "content-type": "application/json"
    };

    return axios.post(url, data, { headers })
};

// other CRUD methods
export default {
    login,
    getAllHost,
    getAllItems,
    getAllApplications
};