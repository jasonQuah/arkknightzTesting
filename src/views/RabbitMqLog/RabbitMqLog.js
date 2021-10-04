import React, { useState, useCallback } from 'react';
import { Card } from 'react-bootstrap';
import Config from "../../config.json";
import { Container } from 'reactstrap';
import { useDropzone } from 'react-dropzone';
import TableWithExcelGenerator from '../../components/DataTables/TableWithExcelGenerator';
import styled from 'styled-components';
import PayloadDetailForm from '../../components/Forms/PayloadDetailForm';

const getColor = (props) => {
  if (props.isDragAccept) {
    return '#00e676';
  }
  if (props.isDragReject) {
    return '#ff1744';
  }
  if (props.isDragActive) {
    return '#2196f3';
  }
  return '#eeeeee';
}

const DragAndDropContainer = styled.div`
  flex:1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  border-width: 2px;
  border-radius: 2px;
  border-color: ${props => getColor(props)};
  border-style: dashed;
  background-color: #fafafa;
  color: #bdbdbd;
  outline: none;
  transition: border .24s ease-in-out;
`;

function RabbitMqLog() {
  const environment = Config.REACT_APP_ENV;
  const baseUrl = Config.REACT_APP_BASE_URL;
  const reactAppName = Config.REACT_APP_NAME;
  const zabbixUrl = Config.REACT_APP_ZABBIX_URL;

  console.log(environment, baseUrl, reactAppName, zabbixUrl)
  const [jsonDataFromFile, setJsonData] = useState([])

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

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (acceptedFiles.length > 1) {
      alert('Can only upload 1 file')
      return;
    }
    else {
      setJsonData([]);
    }

    getData(acceptedFiles);

  }, [])
  const { getRootProps, getInputProps } = useDropzone({ onDrop })

  function getData(acceptedFiles) {
    const reader = new FileReader()
    reader.onload = async (e) => {
      const text = reader.result
      setJsonData(JSON.parse(text))
    };
    reader.readAsText(acceptedFiles[0]);
  }

  return (
    <>
      <Container fluid>
        <Card >
          <Card.Header>RabbitMQ Log Reader
          </Card.Header>
          <Card.Body >
            <div style={{ overflowX: "auto" }}>
              <DragAndDropContainer {...getRootProps()}>
                <input {...getInputProps()} />
                <p>Drag 'n' drop some files here, or click to select files</p>
              </DragAndDropContainer>
              <TableWithExcelGenerator columns={columns} data={data} renderRowSubComponent={renderRowSubComponent} />
            </div>
          </Card.Body>
        </Card>
      </Container>
    </>
  )
}

export default RabbitMqLog;



