/*!

=========================================================
* Light Bootstrap Dashboard React - v2.0.0
=========================================================

* Product Page: https://www.creative-tim.com/product/light-bootstrap-dashboard-react
* Copyright 2020 Creative Tim (https://www.creative-tim.com)
* Licensed under MIT (https://github.com/creativetimofficial/light-bootstrap-dashboard-react/blob/master/LICENSE.md)

* Coded by Creative Tim

=========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

*/

import RabbitMqLog from "views/RabbitMqLog/RabbitMqLog";
import DirectRabbitMqLog from "views/DirectRabbitMqLog/DirectRabbitMqLog";
import ZabbixRmqListing from "views/ZabbixRmqListing/ZabbixRmqListing";
import ExchangeQueueCleanup from "views/ExchangeQueueCleanup/ExchangeQueueCleanup";
import ZabbixApplicationListing from "views/ZabbixApplicationListing/ZabbixApplicationListing";


const dashboardRoutes = [
  {
    path: "/rabbitmqlog",
    name: "RabbitMQ Logging",
    icon: "nc-icon nc-notes",
    component: RabbitMqLog,
    layout: "/admin",
  },
  {
    path: "/zabbixrmqlisting",
    name: "Zabbix RMQ Items",
    icon: "nc-icon nc-chart-pie-35",
    component: ZabbixRmqListing,
    layout: "/admin",
  },
  {
    path: "/zabbixapplicationlisting",
    name: "Zabbix Other Items",
    icon: "nc-icon nc-chart-pie-35",
    component: ZabbixApplicationListing,
    layout: "/admin",
  },
  {
    path: "/directrabbitmqlog",
    name: "Direct RMQ Logging",
    icon: "nc-icon nc-notes",
    component: DirectRabbitMqLog,
    layout: "/admin",
  },
  {
    path: "/exchangequeuecleanup",
    name: "RMQ Cleanup",
    icon: "nc-icon nc-notes",
    component: ExchangeQueueCleanup,
    layout: "/admin",
  },
];

export default dashboardRoutes;
