import React, { useCallback, useState } from "react";
import { Form, Button } from "react-bootstrap"
import ZabbixService from "../../services/ZabbixService";
import RmqService from "../../services/RmqService";
import CryptoJS from 'crypto-js'
import Config from "../../config.json";


const LoginForm = ({ setAuth, cookies, setMessages, messages, setLoginGeneratedUrl, loginService }) => {
    const [loginState, setLoginState] = useState({
        username: "",
        password: "",
        rmqEnvironment: "Development",
    })
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    const handleChange = (e) => {
        const { id, value } = e.target
        setLoginState(prevState => ({
            ...prevState,
            [id]: value,
        }))
    }

    // Get Data Auth from Zabbix
    const login = useCallback(() => {
        setIsLoggingIn(true)

        if (loginService === "zabbix") {
            console.log("Call Login API Zabbix")
            ZabbixService.login(loginState)
                .then((response) => {
                    console.log(response)
                    if (response.data.error !== null) {

                        if (setLoginGeneratedUrl !== undefined) {
                            let generatedUrl = Config.REACT_APP_ZABBIX_URL + "/index.php?name=" + loginState.username + "&password=" + loginState.password + "&enter=Sign in";
                            setLoginGeneratedUrl(generatedUrl)
                            cookies.set('zabbixauthData', CryptoJS.Rabbit.encrypt(generatedUrl, 'arknightz',), { maxAge: 6000 })
                        }

                        let data = { ...loginState, "auth": response.data.result}
                        setAuth(data);
                        cookies.set(
                            'zabbixauth',
                            data,
                            { maxAge: 6000 }
                        )
                    }
                    else {
                        setIsLoggingIn(false);
                        setMessages(prevState => ({
                            ...prevState,
                            loginMessage: "Login failed",
                        }))
                    }
                })
                .catch(error => {
                    setIsLoggingIn(false);
                    setMessages(prevState => ({
                        ...prevState,
                        loginMessage: "Login failed",
                    }))
                });
        }
        else if (loginService === "rmq") {
            console.log("Call whoami API")
            RmqService.login(loginState)
                .then(response => {
                    if (!response.ok) {
                        // get error message from body or default to response statusText
                        const error = response.statusText;
                        return Promise.reject(error);
                    }

                    return response.json()
                })
                .then((data) => {
                    setAuth(loginState);
                    cookies.set('rmqauth', loginState, { maxAge: 6000 })
                })
                .catch(error => {
                    setIsLoggingIn(false);
                    setMessages(prevState => ({
                        ...prevState,
                        loginMessage: "Login failed",
                    }))
                    console.error('Error calling RMQ!', error);
                });
        }

    }, [setAuth, cookies, loginState, setLoginGeneratedUrl, setIsLoggingIn, loginService, setMessages])
    return (
        <>
            <Form>
                {loginService == "rmq" &&
                    <Form.Group controlId="rmqEnvironment">
                        <Form.Label>Environment</Form.Label>
                        <Form.Control as="select"
                            value={loginState.rmqEnvironment}
                            onChange={handleChange} >
                            {RmqService.RmqEnvironment.map((element) => {
                                return (<option value={element}>{element}</option>)
                            })
                            }
                        </Form.Control>
                    </Form.Group>
                }
                <Form.Group controlId="username">
                    <Form.Label>{loginService} username</Form.Label>
                    <Form.Control type="username" placeholder="Enter username"
                        value={loginState.zbusername}
                        onChange={handleChange} />
                    <Form.Text className="text-muted">
                    </Form.Text>
                </Form.Group>

                <Form.Group controlId="password">
                    <Form.Label>Password</Form.Label>
                    <Form.Control type="password" placeholder="Password"
                        value={loginState.zbpassword}
                        onChange={handleChange} />
                </Form.Group>
                <Button className={`${isLoggingIn ? "disabled" : ""}`} variant="primary" type="button" onClick={login} >
                    Login
                </Button>

                <Form.Text className="text-muted">
                    {isLoggingIn ? "Logging in.." : messages.loginMessage}
                </Form.Text>
            </Form>
        </>
    )
}

export default LoginForm