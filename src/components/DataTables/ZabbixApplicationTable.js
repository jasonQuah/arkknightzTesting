import React, { useState, useEffect } from 'react'
import { useTable, useRowSelect, useSortBy, useFilters, useGroupBy, useGlobalFilter, useAsyncDebounce, usePagination, useExpanded } from 'react-table'
import { matchSorter } from 'match-sorter'
import BTable from 'react-bootstrap/Table';
import 'bootstrap/dist/css/bootstrap.min.css';

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

function RmqTable({ columns, data, setGenerateUrlDataItems }) {
    const [lastUpdatedTime, setLastUpdatedTime] = useState("")

    useEffect(() => {
        if (data.length > 0) {
            let currentdate = new Date();
            setLastUpdatedTime(currentdate.getDate() + "/"
                + (currentdate.getMonth() + 1) + "/"
                + currentdate.getFullYear() + " @ "
                + currentdate.getHours() + ":"
                + currentdate.getMinutes() + ":"
                + currentdate.getSeconds())
        }
        else {
            setLastUpdatedTime("No Data")
        }
    }, [data])

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
        selectedFlatRows,
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
        state: { pageIndex, pageSize, selectedRowIds },
    } = useTable({
        columns,
        data,
        defaultColumn, // Be sure to pass the defaultColumn option
        filterTypes,
        initialState: {
            sortBy: [
                {
                    id: 'name',
                    desc: false
                }
            ],
            groupBy: ["host"]
        }
    },
        useFilters, // useFilters!
        useGlobalFilter, // useGlobalFilter!
        useGroupBy,
        useSortBy,
        useExpanded,
        usePagination,
        useRowSelect,
        hooks => {
            hooks.visibleColumns.push(columns => {
                return [
                    {
                        id: 'selection',
                        // Make this column a groupByBoundary. This ensures that groupBy columns
                        // are placed after it
                        groupByBoundary: true,
                        // The header can use the table's getToggleAllRowsSelectedProps method
                        // to render a checkbox
                        Header: ({ getToggleAllRowsSelectedProps }) => (
                            <div>
                                <IndeterminateCheckbox {...getToggleAllRowsSelectedProps()} />
                            </div>
                        ),
                        // The cell can use the individual row's getToggleRowSelectedProps method
                        // to the render a checkbox
                        Cell: ({ row }) => (
                            <div>
                                <IndeterminateCheckbox {...row.getToggleRowSelectedProps()} />
                            </div>
                        ),
                    },
                    ...columns,
                ]
            })
        }
    )

    const IndeterminateCheckbox = React.forwardRef(
        ({ indeterminate, ...rest }, ref) => {
            const defaultRef = React.useRef()
            const resolvedRef = ref || defaultRef

            useEffect(() => {
                resolvedRef.current.indeterminate = indeterminate
            }, [resolvedRef, indeterminate])

            return (
                <>
                    <input type="checkbox" ref={resolvedRef} {...rest} />
                </>
            )
        }
    )

    function Legend() {
        return (
            <div
                style={{
                    padding: '0.5rem 0',
                }}
            >
                <span
                    style={{
                        display: 'inline-block',
                        background: '#0aff0082',
                        padding: '0.5rem',
                    }}
                >
                    Grouped
                </span>{' '}
                <span
                    style={{
                        display: 'inline-block',
                        background: '#ffa50078',
                        padding: '0.5rem',
                    }}
                >
                    Aggregated
                </span>{' '}
                <span
                    style={{
                        display: 'inline-block',
                        background: '#ff000042',
                        padding: '0.5rem',
                    }}
                >
                    Repeated Value
                </span>
                {' '}
                <span
                    style={{
                        display: 'inline-block',
                        padding: '0.5rem',
                    }}
                >
                    Last Updated Time: {lastUpdatedTime}
                </span>
            </div>
        )
    }

    // Effect for set generate url data items
    useEffect(() => {
        const selectedIds = Object.keys(selectedRowIds)
        setGenerateUrlDataItems(selectedIds)

    }, [selectedFlatRows, setGenerateUrlDataItems, selectedRowIds]);

    // Render the UI for your table
    return (
        <>
            <Legend />
            <BTable striped bordered hover responsive  {...getTableProps()}  >
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
                                    {column.canGroupBy ? (
                                        // If the column can be grouped, let's add a toggle
                                        <span {...column.getGroupByToggleProps()}>
                                            {column.isGrouped ? '🛑 ' : '👊 '}
                                        </span>
                                    ) : null}
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
                                        return <td
                                            // For educational purposes, let's color the
                                            // cell depending on what type it is given
                                            // from the useGroupBy hook
                                            {...cell.getCellProps()}
                                            style={{
                                                background: cell.isGrouped
                                                    ? '#0aff0082'
                                                    : cell.isAggregated
                                                        ? '#ffa50078'
                                                        : cell.isPlaceholder
                                                            ? '#ff000042'
                                                            : 'white',
                                            }}
                                        >
                                            {cell.isGrouped ? (
                                                // If it's a grouped cell, add an expander and row count
                                                <>
                                                    <span {...row.getToggleRowExpandedProps()}>
                                                        {row.isExpanded ? '👇' : '👉'}
                                                    </span>{' '}
                                                    {cell.render('Cell')} ({row.subRows.length})
                                                </>
                                            ) : cell.isAggregated ? (
                                                // If the cell is aggregated, use the Aggregated
                                                // renderer for cell
                                                cell.render('Aggregated')
                                            ) : cell.isPlaceholder ? null : ( // For cells with repeated values, render null
                                                // Otherwise, just render the regular cell
                                                cell.render('Cell')
                                            )}
                                        </td>
                                    })}
                                </tr>
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

function NumberRangeColumnFilter({
    column: { filterValue = [], preFilteredRows, setFilter, id },
}) {
    const [min, max] = React.useMemo(() => {
        let min = preFilteredRows.length ? preFilteredRows[0].values[id] : 0
        let max = preFilteredRows.length ? preFilteredRows[0].values[id] : 0
        preFilteredRows.forEach(row => {
            min = Math.min(row.values[id], min)
            max = Math.max(row.values[id], max)
        })
        return [min, max]
    }, [id, preFilteredRows])

    return (
        <div
            style={{
                display: 'flex',
            }}
        >
            <input
                value={filterValue[0] || ''}
                type="number"
                onChange={e => {
                    const val = e.target.value
                    setFilter((old = []) => [val ? parseInt(val, 10) : undefined, old[1]])
                }}
                placeholder={`Min (${min})`}
                style={{
                    width: '70px',
                    marginRight: '0.5rem',
                }}
            />
            to
            <input
                value={filterValue[1] || ''}
                type="number"
                onChange={e => {
                    const val = e.target.value
                    setFilter((old = []) => [old[0], val ? parseInt(val, 10) : undefined])
                }}
                placeholder={`Max (${max})`}
                style={{
                    width: '70px',
                    marginLeft: '0.5rem',
                }}
            />
        </div>
    )
}

function SetCustomAggregateValue(leaf, aggregated) {
    if (leaf[0] === "rabbitmq.overview.queue_totals.messages") {
        return "Overview Queue Totals Messages"
    } else {
        return leaf[0];
    }
}

// This is an autoRemove method on the filter function that
// when given the new filter value and returns true, the filter
// will be automatically removed. Normally this is just an undefined
// check, but here, we want to remove the filter if it's not a number
filterGreaterThan.autoRemove = val => typeof val !== 'number'

const ZabbixApplicationTable = ({ jsonData, setGenerateUrlDataItems }) => {
    const columns = React.useMemo(
        () => [
            {
                Header: 'Host',
                accessor: 'host',

            },
            {
                Header: 'Item ID',
                accessor: 'itemid',

            },
            {
                Header: 'Name',
                accessor: 'name',
                // Use another two-stage aggregator here to
                // first count the UNIQUE values from the rows
                // being aggregated, then sum those counts if
                // they are aggregated further
                aggregate: 'uniqueCount',
                Aggregated: ({ value }) => `${value} Unique Names`,
            },
            {
                Header: 'Key',
                accessor: 'key_',
                // Aggregate the average age of visitorsf
                aggregate: SetCustomAggregateValue,
                Aggregated: `Key`,
            },
            {
                Header: 'Last Value',
                accessor: 'lastvalue',
                // Aggregate the sum of all visits
                Cell: ({ row }) => (
                    <div>
                        {row.original.lastvalue.length > 32 ? row.original.lastvalue.substring(0, 32) + "..." : row.original.lastvalue}
                    </div>
                ),
                aggregate: SetCustomAggregateValue,
                Aggregated: `Last Value`,
                Filter: NumberRangeColumnFilter,
                filter: 'between',
            },
            {
                Header: 'Previous Value',
                accessor: 'prevvalue',
                Cell: ({ row }) => (
                    <div>
                        {row.original.prevvalue.length > 32 ? row.original.prevvalue.substring(0, 32) + "..." : row.original.prevvalue}
                    </div>
                ),
                aggregate: SetCustomAggregateValue,
                Aggregated: `Previous Value`,
                Filter: NumberRangeColumnFilter,
                filter: 'between',
            }
        ],
        []
    )

    const data = React.useMemo(() => jsonData, [jsonData])

    return (
        <RmqTable columns={columns} data={data} setGenerateUrlDataItems={setGenerateUrlDataItems} />
    )
}


export default ZabbixApplicationTable
