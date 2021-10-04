import React, { useState, useEffect } from 'react'
import { useTable, useSortBy, useFilters, useGlobalFilter, useAsyncDebounce, usePagination, useExpanded } from 'react-table'
import { matchSorter } from 'match-sorter'
import BTable from 'react-bootstrap/Table';
import 'bootstrap/dist/css/bootstrap.min.css';
import { CSVLink } from "react-csv";
import { FormFeedback } from 'reactstrap';

// Define a default UI for filtering
function GlobalFilter({
    preGlobalFilteredRows,
    globalFilter,
    setGlobalFilter,
}) {
    const count = preGlobalFilteredRows.length
    const [value, setValue] = React.useState(globalFilter)
    const onChange = useAsyncDebounce(value => {
        setGlobalFilter(value || undefined)
    }, 200)

    return (
        <span>
            Search:{' '}
            <input
                value={value || ""}
                onChange={e => {
                    setValue(e.target.value);
                    onChange(e.target.value);
                }}
                placeholder={`${count} records...`}
                style={{
                    fontSize: '1.1rem',
                    border: '0',
                }}
            />
        </span>
    )
}

// Define a default UI for filtering
function DefaultColumnFilter({
    column: { filterValue, preFilteredRows, setFilter },
}) {
    const count = preFilteredRows.length

    return (
        <input
            value={filterValue || ''}
            onChange={e => {
                setFilter(e.target.value || undefined) // Set undefined to remove the filter entirely
            }}
            placeholder={`Search ${count} records...`}
        />
    )
}

// Let the table remove the filter if the string is empty
fuzzyTextFilterFn.autoRemove = val => !val


function fuzzyTextFilterFn(rows, id, filterValue) {
    return matchSorter(rows, filterValue, { keys: [row => row.values[id]] })
}

function TableWithExcelGenerator({ columns, data, renderRowSubComponent }) {
    const [downloadState, setDownloadState] = useState(false)
    const [rmqErrorData, setRmqErrorData] = useState([])

    useEffect(() => {
        setDownloadState((T) => {
            return false;
        })
    }, [data]);

    const filterTypes = React.useMemo(
        () => ({
            // Add a new fuzzyTextFilterFn filter type.
            fuzzyText: fuzzyTextFilterFn,
            // Or, override the default text filter to use
            // "startWith"
            text: (rows, id, filterValue) => {
                return rows.filter(row => {
                    const rowValue = row.values[id]
                    return rowValue !== undefined
                        ? String(rowValue)
                            .toLowerCase()
                            .startsWith(String(filterValue).toLowerCase())
                        : true
                })
            },
        }),
        []
    )

    const defaultColumn = React.useMemo(
        () => ({
            // Let's set up our default Filter UI
            Filter: DefaultColumnFilter,
        }),
        []
    )
    // Use the state and functions returned from useTable to build your UI
    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        prepareRow,
        state,
        visibleColumns,
        preGlobalFilteredRows,
        setGlobalFilter,
        page,   // Instead of using 'rows', we'll use page,
        // which has only the rows for the active page
        // The rest of these things are super handy, too ;)
        canPreviousPage,
        canNextPage,
        pageOptions,
        pageCount,
        gotoPage,
        nextPage,
        previousPage,
        setPageSize,
        state: { pageIndex, pageSize },
    } = useTable({
        columns,
        data,
        defaultColumn, // Be sure to pass the defaultColumn option
        filterTypes,
        initialState: {
            hiddenColumns: ["payload"]
        }
    },
        useFilters, // useFilters!
        useGlobalFilter, // useGlobalFilter!
        useSortBy,
        useExpanded,
        usePagination,
    )

    let processedData = [];

    function jsonObjectFormatting(object) {
        // To show "false" string since false boolean value won't able to show when generating to csv 
        if (typeof object === 'boolean') {
            return object.toString();
        }
        // To differentiate not ensure double quote content not conflicting with double quote's csv separator
        else if (typeof object === 'string') {
            return object.toString().replace(/"/g, "'");
        }
        else {
            return object;
        }
    }

    function newObjectMerge(target, object, parentKey, key) {
        let newKey = parentKey + (parentKey === '' ? '' : '.') + key
        let newPair = { [newKey]: jsonObjectFormatting(object) };
        return { ...target, ...newPair };
    }
    
    function flat(source, parentString) {
        let target = {}
        Object.keys(source).forEach(function (k) {
            let o;
            try {
                if (source[k] && typeof source[k] === 'object') {
                    let newObject = {}
                    Object.keys(source[k]).forEach(key => {
                        newObject = newObjectMerge(newObject, source[k][key], parentString, k + '.' + key);
                    });

                    target = { ...target, ...newObject };
                }
                else {
                    o = JSON.parse(source[k]);
                    if (o && typeof o === 'object') {
                        target = { ...target, ...flat(o, parentString + (parentString === '' ? '' : '.') + k) };
                    } else {
                        target = newObjectMerge(target, source[k], parentString, k);
                    }
                }
            } catch (e) {
                target = newObjectMerge(target, source[k], parentString, k);
            }
        });
        return target;
    }

    const flattingResult = (source) => new Promise(resolve => {
        let flattingResult = {}
        flattingResult = flat(source, '')
        resolve(flattingResult)
    });

    const asyncForEach = async () => new Promise(resolve => {
        for (let index = 0; index < data.length; index++) {
            flattingResult(data[index], index, data).then(dataReturn => {
                processedData.push(dataReturn)
            });
        }
        resolve(processedData);
    });

    const getRmqData = async () => {
        asyncForEach().then(value => {
            setRmqErrorData(value);
            setDownloadState(true);
        })
    }

    // Render the UI for your table
    return (
        <>
            {downloadState === true &&
                <>
                    <CSVLink id="csvDownloadButton" className="btn btn-primary" filename={"RabbitMQErrorSummary.csv"}
                        data={rmqErrorData} >
                        Download CSV
                    </CSVLink>
                </>
            }
            {
                (downloadState === false && data.length > 0) &&
                <>
                    <button className="btn btn-primary" onClick={getRmqData}>Generate CSV</button>
                </>
            }
            {renderRowSubComponent !== undefined &&
                <div className="col-12">Click 👉 to expand message's payload and 👇 to collapse.</div>
            }
            <BTable striped bordered hover size="sm" {...getTableProps()} >
                <thead>
                    {headerGroups.map(headerGroup => (
                        <tr {...headerGroup.getHeaderGroupProps()}>
                            {headerGroup.headers.map(column => (
                                <th {...column.getHeaderProps()}>
                                    {/* Add a sort direction indicator */}
                                    <span {...column.getSortByToggleProps()}>
                                        {column.render('Header')}
                                        {column.isSorted
                                            ? column.isSortedDesc
                                                ? ' 🔽'
                                                : ' 🔼'
                                            : ' '}
                                    </span>
                                    <div><div>{column.canFilter ? column.render('Filter') : null}</div></div>
                                </th>
                            ))}
                        </tr>
                    ))}
                    <tr>
                        <th
                            colSpan={visibleColumns.length}
                            style={{
                                textAlign: 'left',
                            }}
                        >
                            <GlobalFilter
                                preGlobalFilteredRows={preGlobalFilteredRows}
                                globalFilter={state.globalFilter}
                                setGlobalFilter={setGlobalFilter}
                            />
                        </th>
                    </tr>
                </thead>
                <tbody {...getTableBodyProps()}>
                    {page.map((row, i) => {
                        prepareRow(row)
                        return (
                            <React.Fragment key={row.getRowProps().key.toString()}>
                                <tr >
                                    {row.cells.map(cell => {
                                        return <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
                                    })}
                                </tr>
                                {row.isExpanded ? (
                                    <tr>
                                        <td colSpan={visibleColumns.length} >
                                            {/*
                                            Inside it, call our renderRowSubComponent function. In reality,
                                            you could pass whatever you want as props to
                                            a component like this, including the entire
                                            table instance. But for this example, we'll just
                                            pass the row
                                            */}
                                            {renderRowSubComponent !== undefined &&
                                                renderRowSubComponent({ row })}
                                        </td>
                                    </tr>
                                ) : null}
                            </React.Fragment>
                        )
                    })}
                </tbody>
            </BTable>
            {/* 
        Pagination can be built however you'd like. 
        This is just a very basic UI implementation:
      */}
            <div className="pagination">
                <button onClick={() => gotoPage(0)} disabled={!canPreviousPage}>
                    {'<<'}
                </button>{' '}
                <button onClick={() => previousPage()} disabled={!canPreviousPage}>
                    {'<'}
                </button>{' '}
                <button onClick={() => nextPage()} disabled={!canNextPage}>
                    {'>'}
                </button>{' '}
                <button onClick={() => gotoPage(pageCount - 1)} disabled={!canNextPage}>
                    {'>>'}
                </button>{' '}
                <span>
                    Page{' '}
                    <strong>
                        {pageIndex + 1} of {pageOptions.length}
                    </strong>{' '}
                </span>
                <span>
                    | Go to page:{' '}
                    <input
                        type="number"
                        defaultValue={pageIndex + 1}
                        onChange={e => {
                            const page = e.target.value ? Number(e.target.value) - 1 : 0
                            gotoPage(page)
                        }}
                        style={{ width: '100px' }}
                    />
                </span>{' '}
                <select
                    value={pageSize}
                    onChange={e => {
                        setPageSize(Number(e.target.value))
                    }}
                >
                    {[10, 20, 30, 40, 50].map(pageSize => (
                        <option key={pageSize} value={pageSize}>
                            Show {pageSize}
                        </option>
                    ))}
                </select>
            </div>
        </>
    )
}

// Define a custom filter filter function!
function filterGreaterThan(rows, id, filterValue) {
    return rows.filter(row => {
        const rowValue = row.values[id]
        return rowValue >= filterValue
    })
}

// This is an autoRemove method on the filter function that
// when given the new filter value and returns true, the filter
// will be automatically removed. Normally this is just an undefined
// check, but here, we want to remove the filter if it's not a number
filterGreaterThan.autoRemove = val => typeof val !== 'number'

export default TableWithExcelGenerator
