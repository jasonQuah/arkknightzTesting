import axios from 'axios';
// import Config from "../config.json";

const RmqEnvironment = ['Development','Staging']

const setBaseURL = (env) => {
    env = env.toLowerCase()
    switch (env) {
        case 'development':
            return "http://monitor.rmq01.f1.devgambit.net:8000/"
        case 'staging':
           return "https://monitor-stag-rabbitmq1.gamealiyun.com/"
        default:
            return "";
    }
}

const login = (loginData) => {
    console.log(loginData)
    const url = setBaseURL(loginData.rmqEnvironment) + "api/whoami";

    let headers = new Headers({ 'Authorization': 'Basic ' + btoa(loginData.username + ":" + loginData.password) })
    return fetch(url, {
        method: 'GET',
        headers: headers,
    })
};

const getAllQueue = (loginData) => {
    const url = setBaseURL(loginData.rmqEnvironment) + "api/queues";
    let headers = new Headers({ 'Authorization': 'Basic ' + btoa(loginData.username + ":" + loginData.password) })
    return fetch(url, {
        method: 'GET',
        headers: headers,
    })
};

const getAllExchange = (loginData) => {
    const url = setBaseURL(loginData.rmqEnvironment) + "api/exchanges";
    let headers = new Headers({ 'Authorization': 'Basic ' + btoa(loginData.username + ":" + loginData.password) })
    return fetch(url, {
        method: 'GET',
        headers: headers,
    })
};

const getQueueMessages = (loginData, vhost, name, count) => {
    console.log('getqueulogin', loginData, vhost, name, count)
    const url = setBaseURL(loginData.rmqEnvironment) + "api/queues/" + vhost + "/" + name + "/get";
    let headers = new Headers({
        'Authorization': 'Basic ' + btoa(loginData.username + ":" + loginData.password),
        'Content-Type': 'application/json'
    })
    return fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
            "count": count,
            "requeue": true,
            "encoding": "auto"
        })
    })
};

const deleteQeueu = (loginData, vhost, name) => {
    console.log('deleteQeueu', loginData, vhost, name)
    const url = setBaseURL(loginData.rmqEnvironment) + "api/queues/" + vhost + "/" + name;
    let headers = new Headers({
        'Authorization': 'Basic ' + btoa(loginData.username + ":" + loginData.password),
    })
    return fetch(url, {
        method: 'DELETE',
        headers: headers
    })
};  

const deleteExchange = (loginData, vhost, name) => {
    console.log('deleteQeueu', loginData, vhost, name)
    const url = setBaseURL(loginData.rmqEnvironment) + "api/exchanges/" + vhost + "/" + name + "?if-unused=trues";
    let headers = new Headers({
        'Authorization': 'Basic ' + btoa(loginData.username + ":" + loginData.password),
    })
    return fetch(url, {
        method: 'DELETE',
        headers: headers
    })
};

// other CRUD methods
export default {
    login,
    getAllQueue,
    getQueueMessages,
    getAllExchange,
    deleteQeueu,
    deleteExchange,
    RmqEnvironment
};