import React from "react";
import UsersTable from "../../components/tables/UsersTable";

const UsersAdmin: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Users (Admin)</h1>
      <UsersTable />
    </div>
  );
};

export default UsersAdmin;
