import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { InputSelect } from "./components/InputSelect";
import { Instructions } from "./components/Instructions";
import { Transactions } from "./components/Transactions";
import { useEmployees } from "./hooks/useEmployees";
import { usePaginatedTransactions } from "./hooks/usePaginatedTransactions";
import { useTransactionsByEmployee } from "./hooks/useTransactionsByEmployee";
import { EMPTY_EMPLOYEE } from "./utils/constants";
import { Employee } from "./utils/types";

export function App() {
  const { data: employees, ...employeeUtils } = useEmployees();
  const { data: paginatedTransactions, ...paginatedTransactionsUtils } = usePaginatedTransactions();
  const { data: transactionsByEmployee, ...transactionsByEmployeeUtils } = useTransactionsByEmployee();
  const [isLoading, setIsLoading] = useState(false);
  const [showViewMore, setShowViewMore] = useState(true);

  const transactions = useMemo(
    () => paginatedTransactions?.data ?? transactionsByEmployee ?? null,
    [paginatedTransactions, transactionsByEmployee]
  );

  const loadAllTransactions = useCallback(async () => {
    console.log("Inside loadAllTransactions");
    transactionsByEmployeeUtils.invalidateData();
    await paginatedTransactionsUtils.fetchAll();
  }, [paginatedTransactionsUtils, transactionsByEmployeeUtils]);

  const loadAllEmployees = useCallback(async () => {
    setIsLoading(true);
    await employeeUtils.fetchAll();
    setIsLoading(false);
  }, [employeeUtils]);

  const loadTransactionsByEmployee = useCallback(
    async (employeeId: string) => {
      console.log("Inside loadTransactionsByEmployee");
      paginatedTransactionsUtils.invalidateData();
      await transactionsByEmployeeUtils.fetchById(employeeId);
    },
    [paginatedTransactionsUtils, transactionsByEmployeeUtils]
  );

  // Fixed Bug 5
  useEffect(() => {
    if (employees === null && !employeeUtils.loading) {
      loadAllEmployees();
      loadAllTransactions();
    }
  }, [employeeUtils.loading, employees, loadAllTransactions, loadAllEmployees]);

  useEffect(() => {
    setShowViewMore(paginatedTransactions?.nextPage !== null);
  }, [paginatedTransactions]);

  return (
    <Fragment>
      <main className="MainContainer">
        <Instructions />

        <hr className="RampBreak--l" />

        <InputSelect<Employee>
          isLoading={isLoading}
          defaultValue={EMPTY_EMPLOYEE}
          items={employees === null ? [] : [EMPTY_EMPLOYEE, ...employees]}
          label="Filter by employee"
          loadingLabel="Loading employees"
          parseItem={(item) => ({
            value: item.id,
            label: `${item.firstName} ${item.lastName}`,
          })}
          // Fixed Bug 3
          onChange={async (newValue) => {
            if (newValue === null) {
              return;
            }
            if (newValue.id === EMPTY_EMPLOYEE.id) {
              await loadAllTransactions();
            } else {
              await loadTransactionsByEmployee(newValue.id);
            }
          }}
        />

        <div className="RampBreak--l" />

        <div className="RampGrid">
          <Transactions transactions={transactions} />

          {transactions !== null && showViewMore && (
            <button
              className="RampButton"
              disabled={paginatedTransactionsUtils.loading}
              onClick={async () => {
                // Fixed Bug 6
                setShowViewMore(false);
                await loadAllTransactions();
              }}
            >
              View More
            </button>
          )}
        </div>
      </main>
    </Fragment>
  );
}
