// // import './App.css';
import React, { useState, useCallback, useEffect } from "react";
import {
    Container,
    Row,
    Col,
    Card,
    Form,
    InputGroup,
    Button,
    Modal,
} from "react-bootstrap";
import RmqService from "../../services/RmqService";
import LoginForm from "../../components/Forms/LoginForm";
import Cookies from "universal-cookie";
import ExchangQueueTable from "../../components/DataTables/ExchangQueueTable";
import { useHistory } from "react-router-dom";
import DeleteConfirmationContent from "./DeleteConfirmationContent";
import NotificationAlert from "react-notification-alert";


function ExchangeQueueCleanup() {

    const cookies = new Cookies();
    const history = useHistory();

    const [rmqAuth, setRmqAuth] = useState("");
    const [messages, setMessages] = useState({
        loginMessage: "",
    });
    const [jsonDataFromRmq, setJsonData] = useState([]);

    const [cleanupType, setCleanupType] = useState("");
    const [cleanupTypeDisplay, setCleanupTypeDisplay] = useState("");
    const [validJsonData, setValidJsonData] = useState([]);
    const [invalidJsonData, setInvalidJsonData] = useState([]);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // METHODS
    const checkAuthCookie = () => {
        if (rmqAuth !== "") {
            const rmqAuthCookie = cookies.get("rmqauth");

            if (rmqAuthCookie === "" || rmqAuthCookie === undefined) {
                //reset initial state
                setJsonData([]);
                history.push(); //Remove params

                setRmqAuth("");
                setMessages((prevState) => ({
                    ...prevState,
                    loginMessage: "Session terminated, re-login, please.",
                }));
            }
        }
    };

    // Get All accesible Queue on current authorized user
    const fetchDataRmqAllQueue = useCallback(() => {
        console.log("Call Get All queue API RMQ");
        return RmqService.getAllQueue(rmqAuth)
            .then((response) => {
                if (!response.ok) {
                    // get error message from body or default to response statusText
                    const error = response.statusText;
                    return Promise.reject(error);
                }

                return response.json();
            })
            .then((data) => {
                console.log(data);
                let validQueues = data.filter(
                    (queue) =>
                        !(
                            queue.consumers > 0 || // Skipping queue with consumers
                            queue.name.toLowerCase().indexOf("error") > -1
                        ) // Skipping error queue
                );
                let invalidQueues = data.filter(
                    (queue) =>
                        queue.consumers > 0 ||
                        queue.name.toLowerCase().indexOf("error") > -1
                );
                //set data
                setValidJsonData(
                    validQueues.map((obj) => ({ ...obj, dataRemark: "" }))
                );
                setInvalidJsonData(
                    invalidQueues.map((obj) => ({
                        ...obj,
                        dataRemark: setInvalidRemark(obj, "queue"),
                    }))
                );
            })
            .catch((error) => {
                console.error("Error calling RMQ!", error);
            });
    }, [rmqAuth]);

    // Get All accesible Exchange on current authorized user
    const fetchDataRmqAllExchange = useCallback(() => {
        console.log("Call Get All exchange API RMQ");
        return RmqService.getAllExchange(rmqAuth)
            .then((response) => {
                if (!response.ok) {
                    // get error message from body or default to response statusText
                    const error = response.statusText;
                    return Promise.reject(error);
                }

                return response.json();
            })
            .then((data) => {
                console.log(data);
                let validExchange = data.filter(
                    (exchange) =>
                        !(
                            exchange.internal || // Skipping exchange with empty name.
                            exchange.name.length < 1 || // Skipping exchange with empty name
                            exchange.name.startsWith("amq.") || // Skipping exchange start with amq.
                            exchange.user_who_performed_action === "rmq-internal" // Skipping exchange that created by rmq-internal.
                        )
                );

                // Valid exchange opposite
                let invalidExchange = data.filter(
                    (exchange) =>
                        exchange.internal ||
                        exchange.name.length < 1 ||
                        exchange.name.startsWith("amq.") ||
                        exchange.user_who_performed_action === "rmq-internal"
                );

                //set data
                setValidJsonData(
                    validExchange.map((obj) => ({ ...obj, dataRemark: "" }))
                );
                setInvalidJsonData(
                    invalidExchange.map((obj) => ({
                        ...obj,
                        dataRemark: setInvalidRemark(obj, "exchange"),
                    }))
                );
            })
            .catch((error) => {
                console.error("Error calling RMQ!", error);
            });
    }, [rmqAuth]);

    // Get selected cleanup type data
    const getCleanupDataByType = useCallback(() => {
        console.log(cleanupType);
        if (cleanupType === "queue") {
            fetchDataRmqAllQueue();
            setCleanupTypeDisplay(cleanupType);
        } else if (cleanupType === "exchange") {
            fetchDataRmqAllExchange();
            setCleanupTypeDisplay(cleanupType);
        }
    }, [rmqAuth, jsonDataFromRmq, cleanupType]);

    // EFFECTS
    //Initial constructor effect
    useEffect(() => {
        // set auth state data taken from cookie if auth cookie exist.
        if (rmqAuth === "") {
            const rmqAuthCookie = cookies.get("rmqauth");

            if (!(rmqAuthCookie === "" || rmqAuthCookie === undefined)) {
                setRmqAuth(rmqAuthCookie);
            }
        }
    }, [rmqAuth, setRmqAuth]);

    // Effect if zabxAuth changed
    useEffect(() => {
        const interval_id = setInterval(checkAuthCookie, 3000);
        return () => {
            // Stop the interval when the component unmounts.
            // Otherwise it will keeep going and you will get an error.
            clearInterval(interval_id);
        };
    });

    function logout() {
        // clear cookies
        cookies.remove("rmqauth");

        setTimeout(function () {
            checkAuthCookie();
        }, 100);
    }

    const setInvalidRemark = (data, type) => {
        let remark = "";
        if (type === "queue") {
            if (data.consumers > 0) {
                remark += "Queue with consumers.";
            }
            if (data.name.toLowerCase().indexOf("error") > -1) {
                remark += remark === "" ? "" : " ";
                remark += "Error queue.";
            }
        } else if (type === "exchange") {
            if (data.internal) {
                remark += "Internal exchange";
            }
            if (data.name.length < 1) {
                remark += remark === "" ? "" : " ";
                remark += "Exchange with empty name.";
            }
            if (data.name.startsWith("amq.")) {
                remark += remark === "" ? "" : " ";
                remark += 'Exchange start with "amq.".';
            }
            if (data.name.startsWith("amq.")) {
                remark += remark === "" ? "" : " ";
                remark += "Exchange that created by rmq-internal.";
            }
        }

        return remark;
    };

    // Notification section
    const notificationAlertRef = React.useRef(null);
    const notify = (place) => {
        var type = "primary"
        var options = {};
        options = {
            place: place,
            message: (
                <div>
                    <div>
                       All selected item(s) are successfully deleted
                    </div>
                </div>
            ),
            type: type,
            icon: "nc-icon nc-bell-55",
            autoDismiss: 7,
        };
        notificationAlertRef.current.notificationAlert(options);
    };
    // End of notification section


    // HANDLE METHODS
    function handleCleanupType(e) {
        const { id, value } = e.target;
        setCleanupType(value);
    }
    // Delete Confirm Modal
    const handleClose = () => setShowDeleteConfirm(false);
    const handleShow = () => setShowDeleteConfirm(true);

    const handleDeleteFromTable = useCallback(
        (dataCategory, currentRowData) => {
            if (dataCategory === "included") {
                setInvalidJsonData([...invalidJsonData, currentRowData]);
                setValidJsonData(
                    validJsonData.filter(
                        (queue) =>
                            !(
                                queue.name === currentRowData.name &&
                                queue.vhost === currentRowData.vhost
                            )
                    )
                );
            } else if (dataCategory === "excluded") {
                setValidJsonData([...validJsonData, currentRowData]);
                setInvalidJsonData(
                    invalidJsonData.filter(
                        (queue) =>
                            !(
                                queue.name === currentRowData.name &&
                                queue.vhost === currentRowData.vhost
                            )
                    )
                );
            }
            console.log("swapping data", dataCategory, currentRowData);
        },
        [invalidJsonData, validJsonData, setValidJsonData, setInvalidJsonData]
    );

    const handleExcludeAll = useCallback(() => {
        setInvalidJsonData([...invalidJsonData, ...validJsonData]);
        setValidJsonData([]);
    }, [invalidJsonData, validJsonData, setValidJsonData, setInvalidJsonData]);

    const handleDeleteSelected = useCallback(() => {
        if (cleanupTypeDisplay === "queue") {
            validJsonData.forEach((currentValue, index, arr) => {
                console.log(
                    "deleteCall",
                    rmqAuth,
                    currentValue.vhost === "/" ? "%2f" : currentValue.vhost,
                    currentValue.name
                );
                RmqService.deleteQeueu(
                    rmqAuth,
                    currentValue.vhost === "/" ? "%2f" : currentValue.vhost,
                    currentValue.name
                )
                    .then((response) => {
                        console.log(response);

                        if (!response.ok) {
                            // get error message from body or default to response statusText
                            const error = response.statusText;
                            return Promise.reject(error);
                        } else if (response.status === 204) {
                            console.log(
                                "Host: " +
                                currentValue.vhost +
                                " , Name: " +
                                currentValue.vhost +
                                " => Queue deleted successfully"
                            );
                        }

                        if (index === validJsonData.length - 1) {
                            setValidJsonData([]);
                            handleClose();
                            notify("tr")
                        }
                    })
                    .catch((error) => {
                        console.error("Error calling RMQ!", error);
                    });
            });
        } else if (cleanupTypeDisplay === "exchange") {
            validJsonData.forEach((currentValue, index, arr) => {
                console.log(
                    "deleteCall",
                    rmqAuth,
                    currentValue.vhost === "/" ? "%2f" : currentValue.vhost,
                    currentValue.name
                );
                RmqService.deleteExchange(
                    rmqAuth,
                    currentValue.vhost === "/" ? "%2f" : currentValue.vhost,
                    currentValue.name
                )
                    .then((response) => {
                        console.log(response);
                        if (!response.ok) {
                            // get error message from body or default to response statusText
                            const error = response.statusText;
                            return Promise.reject(error);
                        } else if (response.status === 204) {
                            console.log(
                                "Host: " +
                                currentValue.vhost +
                                " , Name: " +
                                currentValue.vhost +
                                " => Exchange deleted successfully"
                            );
                        }
                        if (index === validJsonData.length - 1) {
                            setValidJsonData([]);
                        }
                    })
                    .catch((error) => {
                        console.error("Error calling RMQ!", error);
                    });
            });
        }
    }, [validJsonData, setValidJsonData]);

    return (
        <>
            <Container fluid>
                <Card>
                    <Card.Header>
                        <Row>
                            {rmqAuth !== "" && rmqAuth !== undefined && (
                                <>
                                    <Col> Login as: {rmqAuth.username} </Col>
                                    <Col>
                                        <Button
                                            className="float-right"
                                            variant="primary"
                                            type="button"
                                            onClick={logout}
                                        >
                                            Logout
                                        </Button>
                                    </Col>
                                </>
                            )}
                        </Row>
                    </Card.Header>
                    <Card.Body style={{ overflowX: "auto" }}>
                        {(rmqAuth === "" || rmqAuth === undefined) && (
                            <LoginForm
                                setAuth={setRmqAuth}
                                cookies={cookies}
                                messages={messages}
                                setMessages={setMessages}
                                loginService="rmq"
                            >

                            </LoginForm>
                        )}
                        {rmqAuth !== "" && rmqAuth !== undefined && (
                            <>
                                <Row>
                                    <Col>
                                        <Form.Group>
                                            <Form.Label> Cleanup Type </Form.Label>
                                            <Form.Control
                                                as="select"
                                                value={cleanupType}
                                                onChange={handleCleanupType}
                                            >
                                                <option value=""> --Please choose type-- </option>
                                                <option value="queue"> Queue </option>
                                                <option value="exchange"> Exchange </option>
                                            </Form.Control>
                                        </Form.Group>
                                    </Col>
                                </Row>
                                <Row>
                                    <Col className="col-6" />
                                    <Col className="col-6">
                                        <Button
                                            variant="primary"
                                            className="text-dark"
                                            disabled={cleanupType === ""}
                                            onClick={getCleanupDataByType}
                                            block
                                        >
                                            Get Data
                                        </Button>
                                    </Col>
                                </Row>
                                <Row style={{ padding: "20px 0px 20px 20px" }}> RESULT </Row>
                                {cleanupTypeDisplay == "exchange" && (
                                    <>
                                        <Row style={{ padding: "0px 0px 10px 20px" }}>

                                            Ignore exchange behavior:
                                        </Row>
                                        <Row style={{ padding: "0px 0px 10px 30px" }}>

                                            Exchange with empty name.
                                        </Row>
                                        <Row style={{ padding: "0px 0px 10px 30px" }}>

                                            Exchange with empty name
                                        </Row>
                                        <Row style={{ padding: "0px 0px 10px 30px" }}>

                                            Exchange start with amq.
                                        </Row>
                                        <Row style={{ padding: "0px 0px 10px 30px" }}>

                                            Exchange that created by rmq - internal.
                                        </Row>
                                    </>
                                )}
                                {cleanupTypeDisplay == "queue" && (
                                    <>
                                        <Row style={{ padding: "0px 0px 10px 20px" }}>

                                            Ignore queue behavior:
                                        </Row>
                                        <Row style={{ padding: "0px 0px 10px 30px" }}>

                                            Queue with consumers.
                                        </Row>
                                        <Row style={{ padding: "0px 0px 10px 30px" }}>

                                            Error queue.
                                        </Row>
                                    </>
                                )}
                                {validJsonData.length > 0 && (
                                    <Row style={{ padding: "20px 0px 20px 20px" }}>
                                        <Col>
                                            <Button
                                                variant="light"
                                                className="text-dark"
                                                disabled={validJsonData.length === 0}
                                                onClick={handleExcludeAll}
                                                block
                                            >
                                                Exclude all
                                            </Button>
                                        </Col>
                                        <Col>
                                            <Button
                                                variant="danger"
                                                className="text-dark"
                                                disabled={validJsonData.length === 0}
                                                onClick={handleShow}
                                                block
                                            >
                                                Proceed to delete {validJsonData.length}
                                                data
                                            </Button>
                                        </Col>
                                    </Row>
                                )}
                                <Row style={{ padding: "20px 0px 20px 20px" }}>

                                    Delete List
                                </Row>
                                <ExchangQueueTable
                                    jsonData={validJsonData}
                                    dataCategory="included"
                                    onDelete={handleDeleteFromTable}
                                />
                                <Row style={{ padding: "60px 0px 20px 20px" }}>

                                    Ignore List
                                </Row>
                                <ExchangQueueTable
                                    jsonData={invalidJsonData}
                                    dataCategory="excluded"
                                    onDelete={handleDeleteFromTable}
                                />
                            </>
                        )}
                    </Card.Body>
                </Card>
            </Container>
            {/* modal */}
            <Modal
                show={showDeleteConfirm}
                onHide={handleClose}
                backdrop="static"
                keyboard={false}
                className="modal-primary"
            >
                <Modal.Header closeButton>
                    <Modal.Title> Delete confirmation </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Container>
                        <p>
                            Are you sure to proceed to delete item(s) on following list ?
                            Press 'Delete' to proceed.
                        </p>
                        <DeleteConfirmationContent jsonData={validJsonData} />
                    </Container>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={handleDeleteSelected}>
                        Delete
                    </Button>
                </Modal.Footer>
            </Modal>

            <div className="rna-container">
                <NotificationAlert ref={notificationAlertRef} />
            </div>
        </>
    );
}

export default ExchangeQueueCleanup;
