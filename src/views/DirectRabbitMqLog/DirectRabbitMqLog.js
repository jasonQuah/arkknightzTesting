// // import './App.css';
import React, { useState, useCallback, useEffect } from 'react';
import { Card, Form, InputGroup, Button } from 'react-bootstrap';
import Config from "../../config.json";
import { Container, Row, Col } from 'reactstrap';
import RmqService from '../../services/RmqService'
import LoginForm from "../../components/Forms/LoginForm";
import Cookies from 'universal-cookie';
import { Typeahead } from "react-bootstrap-typeahead";
import TableWithExcelGenerator from '../../components/DataTables/TableWithExcelGenerator';
import { useLocation, useHistory } from "react-router-dom";
import PayloadDetailForm from '../../components/Forms/PayloadDetailForm';


function DirectRabbitMqLog() {
  const environment = Config.REACT_APP_ENV;
  const baseUrl = Config.REACT_APP_BASE_URL;
  const reactAppName = Config.REACT_APP_NAME;
  const zabbixUrl = Config.REACT_APP_ZABBIX_URL;

  const cookies = new Cookies();
  const history = useHistory()
  const search = useLocation().search;

  const [rmqAuth, setRmqAuth] = useState("");
  const [messages, setMessages] = useState({
    loginMessage: ""
  })
  const [selectedVhostAndQueue, setSelectedVhostAndQueue] = useState([]);
  const [listOfVhostAndQueue, setListOfVhostAndQueue] = useState([]);
  const [isLoadingAllQueue, setIsLoadingAllQueue] = useState(false);
  const [jsonDataFromFile, setJsonData] = useState([])
  const [totalPullMessage, setTotalPullMessage] = useState(0)


  //Table data
  const columns = React.useMemo(
    () => [
      {
        Header: () => null, // No header
        id: 'expander', // It needs an ID
        Cell: ({ row }) => (
          // Use Cell to render an expander for each row.
          // We can use the getToggleRowExpandedProps prop-getter
          // to build the expander.
          <div {...row.getToggleRowExpandedProps()}>
            {row.isExpanded ? '👇' : '👉'}
          </div>
        )
      },
      {
        Header: 'Payload Bytes',
        accessor: 'payload_bytes',
      },
      {
        Header: 'Redelivered',
        accessor: d => d.redelivered.toString(),
      },
      {
        Header: 'Exchange',
        accessor: 'exchange',
      },
      {
        Header: 'Routing Key',
        accessor: 'routing_key',
      },
      {
        Header: 'Message Count',
        accessor: 'message_count',
      },
      {
        Header: 'Payload',
        accessor: 'payload',
      },
      {
        Header: 'Payload Encoding',
        accessor: 'payload_encoding',
      },
      {
        Header: 'Properties Type',
        accessor: 'properties.type',
      },
      {
        Header: 'Properties Delivery Mode',
        accessor: 'properties.delivery_mode',
      },
    ],
    []
  )

  const data = React.useMemo(() => jsonDataFromFile, [jsonDataFromFile])

  const renderRowSubComponent = React.useCallback(
    ({ row }) => (
      <pre
        style={{
          fontSize: '13px',
          paddingLeft: '12px'
        }}
      >
        <div style={{
          width: '100vw'
        }} className="col-11">
          <PayloadDetailForm payload={row.values.payload} />
        </div>
      </pre>
    ),
    []
  )
  // End of table data

  // METHODS
  const checkAuthCookie = () => {
    if (rmqAuth !== "") {
      const rmqAuthCookie = cookies.get('rmqauth')

      if (rmqAuthCookie === "" || rmqAuthCookie === undefined) {
        // Reset initial state
        setSelectedVhostAndQueue([])
        setListOfVhostAndQueue([])
        setJsonData([])
        setTotalPullMessage(0)
        history.push() //Remove params


        setRmqAuth("")
        setMessages(prevState => ({
          ...prevState,
          "loginMessage": "Session terminated, re-login, please."
        }))
      }
    }
  }

  // Checking on host list. Call zaabix if empty else take from cookies
  const getAvailableErrorQueue = (async (queryParam) => {
    setIsLoadingAllQueue(true)
    await fetchDataRmqAllErrorQueue(queryParam);
    setIsLoadingAllQueue(false)
  });

  // Get Data Auth from Zabbix
  const fetchDataRmqAllErrorQueue = useCallback((queryParam) => {
    console.log("Call Get All queue API RMQ")
    return RmqService.getAllQueue(rmqAuth)
      .then(response => {
        if (!response.ok) {
          // get error message from body or default to response statusText
          const error = response.statusText;
          return Promise.reject(error);
        }

        return response.json()
      })
      .then((data) => {
        // Filter to only get queue containing 'error' word
        let errorQueues = data.filter(queue => !(queue.name.toLowerCase().indexOf("error") === -1))
        setListOfVhostAndQueue(errorQueues)
        setIsLoadingAllQueue(false)

        // Set initial data when query param exist
        if (queryParam.vhost !== undefined && queryParam.queueName !== undefined) {
          let tempSelectedVhostQueue = errorQueues.filter(queue => queue.vhost === queryParam.vhost && queue.name === queryParam.queueName)

          // Set selected queue
          if (tempSelectedVhostQueue.length > 0) {
            setSelectedVhostAndQueue(tempSelectedVhostQueue)
          }

          // Set total message pull amount
          if (
            !isNaN(queryParam.totalPullMessage) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
            !isNaN(parseFloat(queryParam.totalPullMessage)) // ...and ensure strings of whitespace fail
          ) {
            setTotalPullMessage(queryParam.totalPullMessage)
          }
        }
      })
      .catch(error => {
        setIsLoadingAllQueue(false)
        console.error('Error calling RMQ!', error);
      });
  }, [rmqAuth])

  // Get Data Auth from Zabbix
  const getQueueMessages = useCallback(() => {
    console.log("Call Get All queue API RMQ")
    return RmqService.getQueueMessages(rmqAuth, selectedVhostAndQueue[0].vhost == "/" ? "%2f" : selectedVhostAndQueue[0].vhost, selectedVhostAndQueue[0].name, totalPullMessage)
      .then(response => {
        if (!response.ok) {
          // get error message from body or default to response statusText
          const error = response.statusText;
          return Promise.reject(error);
        }

        return response.json()
      })
      .then((data) => {
        setJsonData(data)
      })
      .catch(error => {
        console.error('Error calling RMQ!', error);
      });
  }, [rmqAuth, jsonDataFromFile, setJsonData, selectedVhostAndQueue, setSelectedVhostAndQueue, totalPullMessage, setTotalPullMessage])


  const logout = () => {
    // clear cookies
    cookies.remove("rmqauth")

    setTimeout(function () {
      checkAuthCookie();
    }, 100)
  }

  // HANDLE METHODS
  function handleSelectQueue(s) {
    let arrObj = [];
    if (s.length > 0) {
      let latestData = s.pop();
      arrObj.push(latestData)
    }
    setSelectedVhostAndQueue(arrObj);
  }

  function handleTotalPullMessage(e) {
    const { id, value } = e.target
    setTotalPullMessage(value)
  }

  // EFFECTS
  //Initial constructor effect
  useEffect(() => {

    // Set default selected host using query param and being called only if authenticated
    if (rmqAuth !== "") {

      const queryParam = {
        vhost: new URLSearchParams(search).get("vhost") || "",
        queueName: new URLSearchParams(search).get("queueName") || "",
        totalPullMessage: new URLSearchParams(search).get("totalPullMessage") || "",
      }
      getAvailableErrorQueue(queryParam)
    }

    // set auth state data taken from cookie if auth cookie exist. 
    if (rmqAuth === "") {
      const rmqAuthCookie = cookies.get('rmqauth')

      if (!(rmqAuthCookie === "" || rmqAuthCookie === undefined)) {
        // let zabbixAuthDataCookieData = CryptoJS.Rabbit.decrypt(zabbixAuthDataCookie, 'arknightz')
        setRmqAuth(rmqAuthCookie)
      }
    }
  }, [rmqAuth, setRmqAuth]);

  // Generate URL query dynamic, only push if selectedHost state has more than 1 value, else ignore.
  useEffect(() => {
    if (selectedVhostAndQueue.length > 0) {
      const params = new URLSearchParams();
      params.set("vhost", selectedVhostAndQueue[0].vhost)
      params.set("queueName", selectedVhostAndQueue[0].name)
      params.set("totalPullMessage", totalPullMessage)
      history.push({ search: params.toString() }) // push update query param
    }
  }, [selectedVhostAndQueue, totalPullMessage])

  // Effect if zabxAuth changed
  useEffect(() => {
    const interval_id = setInterval(checkAuthCookie, 3000);
    return () => {
      // Stop the interval when the component unmounts. 
      // Otherwise it will keeep going and you will get an error.
      clearInterval(interval_id)
    }
  });

  return (
    <>
      <Container fluid>
        <Card >
          <Card.Header>
            <Row>
              {(rmqAuth !== "" && rmqAuth !== undefined) &&
                <>
                  <Col>Login as: {rmqAuth.username}</Col>
                  <Col >

                    <Button className="float-right" variant="primary" type="button" onClick={logout} >
                      Logout
                    </Button>

                  </Col>
                </>
              }
            </Row>
          </Card.Header>
          <Card.Body style={{ overflowX: "auto" }}>

            {(rmqAuth === "" || rmqAuth === undefined) &&
              <LoginForm setAuth={setRmqAuth} cookies={cookies} messages={messages} setMessages={setMessages} loginService="rmq"></LoginForm>
            }
            {(rmqAuth !== "" && rmqAuth !== undefined) &&
              <>
                <Form.Group>
                  <InputGroup>
                    <InputGroup.Prepend>
                      <InputGroup.Text id="basic-addon3">
                        Error Queues
                      </InputGroup.Text>
                    </InputGroup.Prepend>
                    <Typeahead
                      id="basic-example"
                      labelKey={option => ` Vhost: ${option.vhost}, Queue: ${option.name}, Total Message: ${option.messages}`}
                      onChange={handleSelectQueue}
                      options={listOfVhostAndQueue}
                      placeholder="Choose servers..."
                      selected={selectedVhostAndQueue}
                      multiple
                      isLoading={isLoadingAllQueue}
                    />
                  </InputGroup>
                </Form.Group>
                <Form.Group className="align-right">
                  <InputGroup>
                    <InputGroup.Append>
                      <Form.Label>Total Message</Form.Label>
                      <Form.Control type="number" placeholder="Enter total message"
                        value={totalPullMessage}
                        onChange={handleTotalPullMessage}
                      />
                      <Form.Text className="text-muted">
                      </Form.Text>
                    </InputGroup.Append>
                    <InputGroup.Append>
                      <Button
                        variant="primary"
                        className="text-dark"
                        disabled={selectedVhostAndQueue.length === 0 || totalPullMessage < 1}
                        onClick={getQueueMessages}
                        block
                      >
                        Get Messages
                      </Button>
                    </InputGroup.Append>
                  </InputGroup>
                </Form.Group>
                <TableWithExcelGenerator columns={columns} data={data} renderRowSubComponent={renderRowSubComponent} />
              </>
            }
          </Card.Body>
        </Card>
      </Container>
    </>
  )
}

export default DirectRabbitMqLog;
