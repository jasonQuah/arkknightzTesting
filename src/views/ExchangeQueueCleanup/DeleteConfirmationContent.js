import React from 'react';
import Config from "../../config.json";
import TableWithExcelGenerator from '../../components/DataTables/TableWithExcelGenerator';


const DeleteConfirmationContent = ({jsonData}) => {
    const environment = Config.REACT_APP_ENV;
    const baseUrl = Config.REACT_APP_BASE_URL;
    const reactAppName = Config.REACT_APP_NAME;
    const zabbixUrl = Config.REACT_APP_ZABBIX_URL;

    console.log(environment, baseUrl, reactAppName, zabbixUrl)
    // const [jsonDataFromFile, setJsonData] = useState([])

    const columns = React.useMemo(
        () => [
            {
                Header: 'Virtual Host',
                accessor: 'vhost',
                width: 10
            },
            {
                Header: 'Name',
                accessor: 'name',
                width: 50
            },
            {
                Header: 'Remark',
                accessor: 'dataRemark',
                width: 30
            },
        ],
        []
    )

    const data = React.useMemo(() => jsonData, [jsonData])

    return (
        <TableWithExcelGenerator columns={columns} data={data}  />
    )
}

export default DeleteConfirmationContent;



