import { data } from "jquery";
import React from "react";
import { Form, Col, Row } from "react-bootstrap"


const PayloadDetailForm = ({ payload }) => {
    let dataPayload = JSON.parse(payload);

    function DisplayPayload() {
        let basicProperties = [];
        let mainProperties = [];

        if (typeof dataPayload === 'string') {
            dataPayload = JSON.parse(dataPayload);
        }

        Object.keys(dataPayload).forEach(function (k) {
            try {
                if (dataPayload[k] && typeof dataPayload[k] === 'object') {
                    let getBasic = Object.keys(dataPayload[k]).map(function (key) {

                        // Here compare number because brands is an array, so key will be the array position, so return k because its the array name
                        // if its not an array, key will not be number so return key (ex: Brands\":{\"name\":\"Betway\"}), in this case, name
                        // unless the header is number (ex: Brands\":{\"9\":\"Betway\"}) then it will return k, in this case, Brands
                        if(isNaN(key)){
                            return [key, JSON.stringify(dataPayload[k][key])];
                        } else{
                            return [k, JSON.stringify(dataPayload[k][key])];
                        }
                    });
                    basicProperties = getBasic;
                }
                else {
                    let getMain = [k, dataPayload[k]];
                    mainProperties.push(getMain);
                }
            } catch (e) {
                console.log("Error inside this function is ", e)
            }
        });
        return DisplayPayloadProperties(basicProperties, mainProperties);
    }

    function DisplayPayloadProperties(basicProperties, mainProperties) {
        return (
            <>
                <Form.Group as={Row} >
                    <Col className="border col-10" >
                        <h5 style={{ paddingTop: '10px' }}>Main Properties</h5>
                    </Col>
                </Form.Group>

                {mainProperties.map((item, index) => {
                    return (
                        <Form.Group as={Row}>
                            <Col className="border col-1" >
                                {String(item[0])}
                            </Col>
                            
                            <Col className="border text-wrap col-9 text-center">
                                {String(item[1])}
                            </Col>
                        </Form.Group>
                    );
                })}

                {/* Child of Basic Properties*/}

                {basicProperties && basicProperties.length ? (
                    <>
                        <Form.Group as={Row} >
                            <Col className="border col-10" >
                                <h5 style={{ paddingTop: '10px' }}>Basic Properties</h5>
                            </Col>
                        </Form.Group>

                        {basicProperties.map((item, index) => {
                            return (
                                <Form.Group as={Row}>
                                    <Col className="border col-2" >
                                        {String(item[0])}
                                    </Col>
                                    <Col className="border text-wrap col-8 text-center">
                                        {String(item[1])}
                                    </Col>
                                </Form.Group>
                            );
                        })}
                    </>
                ) : null}
            </>
        );
    }

    return (
        <div>
            {DisplayPayload()}
        </div>
    );
};

export default PayloadDetailForm