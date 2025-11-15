import { createDataTable } from "./DataTable.js";

export default {
  title: "DataTable Example",

  async render() {
    return `
      <main class="container mx-auto px-4 py-8">
        <div class="max-w-7xl mx-auto">
          <h1 class="text-3xl font-bold text-gray-900 mb-8">
            <i class="fas fa-table text-indigo-600 mr-3"></i>DataTable Component Examples
          </h1>

          <div class="space-y-8">
            <section class="bg-white rounded-lg shadow-md p-6">
              <h2 class="text-xl font-bold text-gray-900 mb-4">Basic Example</h2>
              <div id="basicTable"></div>
            </section>

            <section class="bg-white rounded-lg shadow-md p-6">
              <h2 class="text-xl font-bold text-gray-900 mb-4">Advanced Example with All Features</h2>
              <div id="advancedTable"></div>
            </section>
          </div>
        </div>
      </main>
    `;
  },

  async afterRender() {
    this.renderBasicExample();
    this.renderAdvancedExample();
  },

  renderBasicExample() {
    const sampleData = [
      { id: 1, name: "John Doe", email: "john@example.com", role: "admin", active: true },
      { id: 2, name: "Jane Smith", email: "jane@example.com", role: "user", active: true },
      { id: 3, name: "Bob Johnson", email: "bob@example.com", role: "user", active: false },
    ];

    createDataTable("basicTable", {
      data: sampleData,
      columns: [
        { key: "id", label: "ID", type: "number" },
        { key: "name", label: "Name", type: "text" },
        { key: "email", label: "Email", type: "email" },
        { key: "role", label: "Role", type: "badge", badgeColors: { admin: "purple", user: "blue" } },
        { key: "active", label: "Active", type: "boolean" },
      ],
      sortable: true,
      filterable: true,
    });
  },

  renderAdvancedExample() {
    const advancedData = [
      {
        id: 1,
        user: { name: "Alice Chen", avatar: null },
        email: "alice@example.com",
        joined: "2024-01-15",
        spent: 15000,
        orders: 24,
        status: "active",
        completion: 85,
      },
      {
        id: 2,
        user: { name: "Bob Wilson", avatar: null },
        email: "bob@example.com",
        joined: "2024-02-20",
        spent: 8500,
        orders: 12,
        status: "inactive",
        completion: 45,
      },
      {
        id: 3,
        user: { name: "Carol Davis", avatar: null },
        email: "carol@example.com",
        joined: "2024-03-10",
        spent: 25000,
        orders: 38,
        status: "active",
        completion: 95,
      },
    ];

    createDataTable("advancedTable", {
      data: advancedData,
      title: "Customer Dashboard",
      subtitle: "View and manage customer data",
      icon: "fa-users",
      columns: [
        {
          key: "user.name",
          label: "Customer",
          type: "avatar",
          nameKey: "user.name",
        },
        { key: "email", label: "Email", type: "email" },
        { key: "joined", label: "Join Date", type: "date", format: "MMM D, YYYY" },
        { key: "spent", label: "Total Spent", type: "currency", prefix: "HKD" },
        { key: "orders", label: "Orders", type: "number" },
        { key: "status", label: "Status", type: "badge", badgeColors: { active: "green", inactive: "red" } },
        { key: "completion", label: "Profile", type: "progress" },
        {
          key: "actions",
          label: "Actions",
          type: "actions",
          actions: (row) => [
            { icon: "fa-eye", label: "View", onClick: `alert('View ${row.user.name}')` },
            { icon: "fa-edit", label: "Edit", onClick: `alert('Edit ${row.user.name}')` },
            { icon: "fa-trash", label: "Delete", color: "red", onClick: `alert('Delete ${row.user.name}')` },
          ],
        },
      ],
      sortable: true,
      filterable: true,
      paginate: true,
      pageSize: 5,
      selectable: true,
      defaultSort: { column: "spent", direction: "desc" },
      onRowClick: (row) => {
        console.log("Row clicked:", row);
      },
      onSelect: (selectedIds) => {
        console.log("Selected IDs:", selectedIds);
      },
    });
  },
};
