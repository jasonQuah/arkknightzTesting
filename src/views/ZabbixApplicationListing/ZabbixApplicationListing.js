import React, { useEffect, useCallback, useState } from 'react';
import { Card, Button, Form, FormControl, InputGroup } from 'react-bootstrap';
import Config from "../../config.json";
import { Container, Row, Col } from 'reactstrap';
import Cookies from 'universal-cookie';
import ZabbixService from "../../services/ZabbixService";
import ZabbixApplicationTable from "../../components/DataTables/ZabbixApplicationTable";
import LoginForm from "../../components/Forms/LoginForm";
import { Typeahead, Menu, MenuItem } from "react-bootstrap-typeahead";
import 'react-bootstrap-typeahead/css/Typeahead.css';
import Countdown, { zeroPad } from 'react-countdown';
import CryptoJS from 'crypto-js'
import { useLocation, useHistory } from "react-router-dom";
import 'react-notifications/lib/notifications.css';

function ZabbixApplicationListing() {
    const environment = Config.REACT_APP_ENV;
    const baseUrl = Config.REACT_APP_BASE_URL;
    const reactAppName = Config.REACT_APP_NAME;
    const zabbixUrl = Config.REACT_APP_ZABBIX_URL;
    const cookies = new Cookies();
    const search = useLocation().search;
    const keyResult = new URLSearchParams(search).get("hosts") || "";
    const history = useHistory()

    const [selectedHost, setSelectedHost] = useState([]);
    const [listOfHost, setListOfHost] = useState([]);
    const [zabxAuth, setZabxAuth] = useState("");
    const [isLoadingAllHost, setIsLoadingAllHost] = useState(false);
    const [isLoadingSearch, setIsLoadingSearch] = useState(false);
    const [dataItems, setDataItems] = useState([]);
    const [generateUrlDataItems, setGenerateUrlDataItems] = useState([]);
    const [generatedGraphUrl, setGeneratedGraphUrl] = useState("");
    const [generatedHistoryUrl, setGeneratedHistoryUrl] = useState("");
    const [countDownReload, setCountDownReload] = useState(Date.now());
    const [countDownTimeInMinute, setCountDownTimeInMinute] = useState(0);
    const [messages, setMessages] = useState({
        loginMessage: ""
    })
    const [zabbixLoginGeneratedUrl, setZabbixLoginGeneratedUrl] = useState("");
    const [totalHistory, setTotalHistory] = useState(0);
    const [totalGraph, setTotalGraph] = useState(0);

    // Check cookie method
    const checkAuthCookie = () => {
        if (zabxAuth !== "") {
            const zabbixAuthCookie = cookies.get('zabbixauth')

            if (zabbixAuthCookie === "" || zabbixAuthCookie === undefined) {
                // reset initial state
                setSelectedHost([])
                setListOfHost([])
                setDataItems([])
                setGenerateUrlDataItems([])

                setZabxAuth("")
                setZabbixLoginGeneratedUrl("")
                setMessages(prevState => ({
                    ...prevState,
                    "loginMessage": "Session terminated, re-login, please."
                }))

            }
        }
    }

    // Get Data Auth from Zabbix
    const fetchDataZabbixAllHost = useCallback((hostsQueryParam) => {
        console.log("Call Get All host API Zabbix")
        return ZabbixService.getAllHost(zabxAuth).then((response) => {
            let listOfHostLocal = response.data.result || []
            setListOfHost(listOfHostLocal);
            localStorage.setItem('zabbixallhost', JSON.stringify(response.data.result))
            setSelectedHost(listOfHostLocal.filter(item => hostsQueryParam.indexOf(item.host) !== -1))
            setIsLoadingAllHost(false)
        });
    }, [zabxAuth])

    // Get Data Auth from Zabbix
    const fetchDataZabbixItems = useCallback(async () => {
        setIsLoadingSearch(true)
        console.log("Call Get All host API Zabbix")
        ZabbixService.getAllApplications(zabxAuth, selectedHost.map(items => items.hostid)).then((response) => {
            setDataItems(response.data.result.map(x => Object.assign(x, selectedHost.find(y => y.hostid === x.hostid))))
            setIsLoadingSearch(false)
        });
    }, [zabxAuth, selectedHost])


    // Checking on host list. Call zaabix if empty else take from cookies
    const getZabbixAllHost = (async (zabbixallhost, hostsQueryParam) => {
        setIsLoadingAllHost(true)
        if (zabbixallhost === "" || zabbixallhost === "undefined" || zabbixallhost === null) {
            console.log("Zabbix All host undefined or empty")
            await fetchDataZabbixAllHost(hostsQueryParam);

        }
        else {
            let listOfHostLocal = JSON.parse(zabbixallhost)
            setListOfHost(listOfHostLocal);
            setSelectedHost(listOfHostLocal.filter(item => hostsQueryParam.indexOf(item.host) !== -1))
            console.log("Already have zabbix all host")
            setIsLoadingAllHost(false)
        }
    });

    // Generate URL query dynamic, only push if selectedHost state has more than 1 value, else ignore.
    useEffect(() => {
        let zabbixHostCookie = localStorage.getItem('zabbixallhost')
        if (selectedHost.length > 0 && !(zabbixHostCookie === "" || zabbixHostCookie === "undefined" || zabbixHostCookie === null)) {
            const params = new URLSearchParams(search);
            params.set("hosts", selectedHost.map(item => item.host).join(','))
            history.push({ search: params.toString() }) // push update query param
        }
    }, [selectedHost])

    const renderer = ({ hours, minutes, seconds, completed }) => {
        if (completed) {
            // Render a completed state
            return <>

                <InputGroup.Prepend>
                    <InputGroup.Text >Auto Reload Search Result</InputGroup.Text>
                </InputGroup.Prepend>
                <FormControl value={countDownTimeInMinute} onChange={handleMinChange} aria-label="Amount (to the nearest dollar)" />
                <InputGroup.Append>
                    <InputGroup.Text>Min</InputGroup.Text>
                </InputGroup.Append>
                <InputGroup.Append>
                    <Button
                        variant="primary"
                        onClick={setTimer}
                    >
                        Start
                    </Button>
                </InputGroup.Append>
            </>
        } else {
            // Render a countdown
            return <>
                <InputGroup.Prepend>
                    <InputGroup.Text >
                        Reload data after countdown: {zeroPad(hours)}:{zeroPad(minutes)}:{zeroPad(seconds)}
                    </InputGroup.Text>
                </InputGroup.Prepend>
                <InputGroup.Append>
                    <Button
                        variant="primary"
                        onClick={stopTimer}
                    >
                        Stop
                    </Button>
                </InputGroup.Append>
            </>
        }
    };

    const stopTimer = () => {
        setCountDownReload(Date.now())
    }

    const setTimer = () => {
        let countTimeInMilisec = countDownTimeInMinute * 1000 * 60
        setCountDownReload(Date.now() + countTimeInMilisec)
    }

    const handleMinChange = (event) => {
        setCountDownTimeInMinute(event.target.value);
    };

    // Use effects

    //Initial constructor effect
    useEffect(() => {

        // Set default selected host using query param and being called only if authenticated
        if (zabxAuth !== "") {
            const hostsQueryParam = keyResult.split(',');
            getZabbixAllHost(localStorage.getItem('zabbixallhost'), hostsQueryParam)
        }

        // set auth state data taken from cookie if auth cookie exist. 
        if (zabxAuth === "") {
            const zabbixAuthCookie = cookies.get('zabbixauth')
            let zabbixAuthDataCookie = cookies.get('zabbixauthData')

            if (!(zabbixAuthCookie === "" || zabbixAuthCookie === undefined)) {
                let zabbixAuthDataCookieData = CryptoJS.Rabbit.decrypt(zabbixAuthDataCookie, 'arknightz')
                setZabxAuth(zabbixAuthCookie)
                setZabbixLoginGeneratedUrl(zabbixAuthDataCookieData.toString(CryptoJS.enc.Utf8))
            }
        }
    }, [zabxAuth, setZabxAuth, setZabbixLoginGeneratedUrl]);

    // Fetch Zabbix's items effect
    useEffect(() => {
        let itemProcessed = 0, historyNum = 0, graphNum = 0
        setTotalHistory(historyNum)
        setTotalGraph(graphNum)
        let historyUrl = Config.REACT_APP_ZABBIX_URL + "/history.php?action=showvalues"
        let graphUrl = Config.REACT_APP_ZABBIX_URL + "/history.php?action=batchgraph&graphtype=0"

        generateUrlDataItems.forEach((item, i, array) => {
            let zabbixItems = dataItems[item]
            let itemId = "";
            
            Object.keys(zabbixItems).forEach(function (k) {
                if (k === "itemid") {
                    itemId = zabbixItems[k];
                }

                if (k === "name") {
                    let compareName = zabbixItems[k].toString().toUpperCase();
                    if (compareName.includes("INFORMATION") || compareName.includes("HOST") || compareName.includes("VERSION") || compareName.includes("RABBITMQ: GET")) {
                        historyUrl = historyUrl.concat('&itemids%5B' + itemId + '%5D=' + itemId)
                        historyNum++;
                    } else {
                        graphUrl = graphUrl.concat('&itemids%5B' + itemId + '%5D=' + itemId)
                        graphNum++;
                    }
                }
            })

            itemProcessed++;
            if (itemProcessed === array.length) {
                setTotalHistory(historyNum)
                setTotalGraph(graphNum)
                setGeneratedGraphUrl(graphUrl)
                setGeneratedHistoryUrl(historyUrl)
            }
        });
    }, [generateUrlDataItems, generatedGraphUrl, generatedHistoryUrl, setGenerateUrlDataItems, setGeneratedGraphUrl, setGeneratedHistoryUrl, setTotalHistory, setTotalGraph]);

    // Effect if zabxAuth changed
    useEffect(() => {
        const interval_id = setInterval(checkAuthCookie, 3000);
        return () => {
            // Stop the interval when the component unmounts. 
            // Otherwise it will keeep going and you will get an error.
            clearInterval(interval_id)
        }
    });

    function logout() {
        // clear cookies
        cookies.remove("zabbixauth")
        cookies.remove("zabbixauthData")
        localStorage.removeItem("zabbixallhost");

        setTimeout(function () {
            checkAuthCookie();
        }, 100)
    }

    return (
        <>
            <Container fluid>
                <Card>
                    <Card.Header>
                        <Row>
                            {(zabxAuth !== "" && zabxAuth !== undefined) &&
                                <>
                                    <Col>Login as: {zabxAuth.username} </Col>
                                    <Col >

                                        <Button className="float-right" variant="primary" type="button" onClick={logout} >
                                            Logout
                                        </Button>

                                    </Col>
                                </>
                            }
                        </Row>
                    </Card.Header>
                    <Card.Body>
                        {(zabxAuth === "" || zabxAuth === undefined || zabxAuth === "undefined") &&
                            <LoginForm setAuth={setZabxAuth} cookies={cookies} messages={messages} setMessages={setMessages} setLoginGeneratedUrl={setZabbixLoginGeneratedUrl} loginService="zabbix" ></LoginForm>
                        }
                        {(zabxAuth !== "" && zabxAuth !== undefined && zabxAuth !== "undefined") &&

                            <Card>
                                <Card.Header>
                                </Card.Header>
                                <Card.Body style={{ overflowX: "auto" }}>
                                    <React.Fragment>
                                        <Form.Group>
                                            <InputGroup>
                                                <InputGroup.Prepend>
                                                    <InputGroup.Text id="basic-addon3">
                                                        Hosts
                                                    </InputGroup.Text>
                                                </InputGroup.Prepend>
                                                <Typeahead
                                                    id="basic-example"
                                                    labelKey={option => `${option.host}`}
                                                    onChange={setSelectedHost}
                                                    options={listOfHost}
                                                    renderMenu={(results, menuProps) => (
                                                        <Menu {...menuProps}>
                                                            {results.map((result, index) => (
                                                                <MenuItem option={result} position={index}>
                                                                    {result.host}
                                                                </MenuItem>
                                                            ))}
                                                        </Menu>
                                                    )}
                                                    placeholder="Choose servers..."
                                                    selected={selectedHost}
                                                    multiple
                                                    isLoading={isLoadingAllHost}
                                                />
                                                <InputGroup.Append>
                                                    <Button
                                                        variant="primary"
                                                        className="text-dark"
                                                        disabled={isLoadingSearch || selectedHost.length === 0}
                                                        onClick={!isLoadingSearch ? fetchDataZabbixItems : null}
                                                    >
                                                        {isLoadingSearch ? 'Loading…' : 'Search'}
                                                    </Button>
                                                </InputGroup.Append>
                                            </InputGroup>
                                        </Form.Group>
                                    </React.Fragment>
                                    <Form.Group className="pull-right">
                                        <InputGroup>
                                            <InputGroup.Append>
                                                <Countdown
                                                    date={countDownReload}
                                                    renderer={renderer}
                                                    autoStart={true}
                                                    key={countDownReload}
                                                    onStop={() => { setCountDownReload(Date.now - 1) }}
                                                    onComplete={() => { setTimer(); fetchDataZabbixItems(); }}
                                                />
                                            </InputGroup.Append>
                                        </InputGroup>
                                    </Form.Group>

                                    <Form.Group>

                                    </Form.Group>
                                    <Form.Group className="align-right">
                                        <InputGroup>
                                            <InputGroup.Prepend>
                                                <InputGroup.Text id="basic-addon3">
                                                    Display Zabbix Graph
                                                </InputGroup.Text>
                                            </InputGroup.Prepend>
                                            <InputGroup.Append>
                                                {totalGraph > 0 &&
                                                    <Button href={generatedGraphUrl} onClick={(e) => { e.preventDefault(); window.open(generatedGraphUrl); }} block>
                                                        {totalGraph} item/s selected
                                                    </Button >
                                                }
                                                {totalGraph === 0 &&
                                                    <Button variant="secondary" className="text-dark" href={generatedGraphUrl} disabled block>
                                                        No Items selected
                                                    </Button >
                                                }
                                            </InputGroup.Append>
                                            <InputGroup.Append>
                                                <Button href={zabbixLoginGeneratedUrl} onClick={(e) => { e.preventDefault(); window.open(zabbixLoginGeneratedUrl) }} block >
                                                    To Zabbix Web with current credential
                                                </Button>
                                            </InputGroup.Append>
                                        </InputGroup>
                                    </Form.Group>



                                    <Form.Group className="align-right">
                                        <InputGroup>
                                            <InputGroup.Prepend>
                                                <InputGroup.Text id="basic-addon3">
                                                    Display Zabbix History
                                                </InputGroup.Text>
                                            </InputGroup.Prepend>
                                            <InputGroup.Append>
                                                {totalHistory > 0 &&
                                                    <Button href={generatedHistoryUrl} onClick={(e) => { e.preventDefault(); window.open(generatedHistoryUrl); }} block>
                                                        {totalHistory} item/s selected
                                                    </Button >

                                                }
                                                {totalHistory === 0 &&
                                                    <Button variant="secondary" className="text-dark" href={generatedHistoryUrl} disabled block>
                                                        No Items selected
                                                    </Button >
                                                }
                                            </InputGroup.Append>
                                        </InputGroup>
                                    </Form.Group>



                                    <ZabbixApplicationTable jsonData={dataItems} setGenerateUrlDataItems={setGenerateUrlDataItems} />
                                </Card.Body>
                            </Card>
                        }
                    </Card.Body>
                </Card>
            </Container>
        </>
    )
}

export default ZabbixApplicationListing;