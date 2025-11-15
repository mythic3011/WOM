# DataTable Component Usage Guide

## Overview

The `DataTable` component provides automatic sorting, filtering, and pagination with minimal configuration. It includes built-in column type presets for common data types.

## Quick Start

```javascript
import { createDataTable } from "/src/components/DataTable.js";

const table = createDataTable("tableContainer", {
  data: myData,
  columns: [
    { key: "name", label: "Name", type: "text" },
    { key: "email", label: "Email", type: "email" },
    { key: "date", label: "Date", type: "date" },
  ],
  sortable: true,
  filterable: true,
});
```

## Column Types

### Built-in Types

1. **text** - Plain text (default)
2. **number** - Numeric values with proper sorting
3. **date** - Dates formatted with dayjs
4. **currency** - Money amounts with prefix
5. **badge** - Colored status badges
6. **avatar** - User avatars with initials fallback
7. **progress** - Progress bars with percentage
8. **boolean** - Check/X icons
9. **link** - Clickable links
10. **email** - Mailto links
11. **phone** - Tel links
12. **image** - Image thumbnails
13. **actions** - Action buttons

### Column Configuration Examples

#### Avatar Column
```javascript
{
  key: "profileImage",
  label: "User",
  type: "avatar",
  nameKey: "name",  // Field to use for initials
  size: "sm"        // xs, sm, md, lg, xl, 2xl
}
```

#### Date Column
```javascript
{
  key: "createdAt",
  label: "Created",
  type: "date",
  format: "MMM D, YYYY"  // dayjs format
}
```

#### Currency Column
```javascript
{
  key: "price",
  label: "Price",
  type: "currency",
  prefix: "HKD"  // or "$", "€", etc.
}
```

#### Badge Column
```javascript
{
  key: "status",
  label: "Status",
  type: "badge",
  badgeColors: {
    active: "green",
    pending: "yellow",
    inactive: "red"
  }
}
```

#### Progress Column
```javascript
{
  key: "completion",
  label: "Progress",
  type: "progress"  // Expects 0-100 value
}
```

#### Actions Column
```javascript
{
  key: "actions",
  label: "Actions",
  type: "actions",
  actions: (row) => [
    {
      icon: "fa-eye",
      label: "View",
      onClick: `window.viewUser(${row.id})`
    },
    {
      icon: "fa-trash",
      label: "Delete",
      color: "red",
      onClick: `window.deleteUser(${row.id})`
    }
  ]
}
```

## Features

### Auto-Sorting
Click any column header to sort. Click again to reverse, third click to clear.

```javascript
{
  sortable: true,  // Enable sorting
  defaultSort: {
    column: "createdAt",
    direction: "desc"
  }
}
```

### Auto-Filtering
Search box filters across all columns automatically.

```javascript
{
  filterable: true  // Adds search box
}
```

### Pagination
```javascript
{
  paginate: true,
  pageSize: 10  // Items per page
}
```

### Row Selection
```javascript
{
  selectable: true,
  onSelect: (selectedIds) => {
    console.log("Selected:", selectedIds);
  }
}
```

### Row Click
```javascript
{
  onRowClick: (row) => {
    window.location.href = `/users/${row.id}`;
  }
}
```

## Advanced Usage

### Nested Data
Use dot notation for nested values:

```javascript
{
  key: "user.profile.name",
  label: "Name",
  type: "text"
}
```

### Custom Render
Override auto-rendering:

```javascript
{
  key: "custom",
  label: "Custom",
  render: (row) => `<div class="custom">${row.data}</div>`
}
```

### State Persistence
Sorting and filtering state is automatically saved to localStorage:

```javascript
{
  tableId: "myUniqueTable"  // Required for state persistence
}
```

## Migration from createTable

### Before
```javascript
createTable({
  columns: [...],
  data: [...],
  onSort: (col, dir) => {
    // Manual sorting logic
    const sorted = data.sort(...);
    updateTable(sorted);
  },
  onSearch: (term) => {
    // Manual filtering logic
    const filtered = data.filter(...);
    updateTable(filtered);
  }
});
```

### After
```javascript
createDataTable("container", {
  columns: [...],
  data: [...],
  sortable: true,   // Auto-handled
  filterable: true  // Auto-handled
});
```

## API Methods

```javascript
const table = createDataTable("container", options);

table.updateData(newData);        // Update data
table.getSelectedRows();           // Get selected row IDs
table.clearSelection();            // Clear selection
table.refresh();                   // Re-render
table.destroy();                   // Cleanup
```

## Complete Example

```javascript
import { createDataTable } from "/src/components/DataTable.js";

const myTable = createDataTable("usersTableContainer", {
  data: users,
  title: "User Management",
  subtitle: "Manage all system users",
  icon: "fa-users",
  
  columns: [
    {
      key: "avatar",
      label: "User",
      type: "avatar",
      nameKey: "name",
      size: "sm"
    },
    {
      key: "email",
      label: "Email",
      type: "email"
    },
    {
      key: "role",
      label: "Role",
      type: "badge",
      badgeColors: {
        admin: "purple",
        user: "blue"
      }
    },
    {
      key: "createdAt",
      label: "Joined",
      type: "date",
      format: "MMM D, YYYY"
    },
    {
      key: "actions",
      label: "Actions",
      type: "actions",
      actions: (row) => [
        { icon: "fa-edit", onClick: `editUser(${row.id})` },
        { icon: "fa-trash", color: "red", onClick: `deleteUser(${row.id})` }
      ]
    }
  ],
  
  sortable: true,
  filterable: true,
  paginate: true,
  pageSize: 20,
  selectable: true,
  
  defaultSort: {
    column: "createdAt",
    direction: "desc"
  },
  
  onRowClick: (row) => {
    console.log("Clicked:", row);
  },
  
  onSelect: (ids) => {
    console.log("Selected:", ids);
  }
});
```

## Tips

1. **Performance**: For large datasets (1000+ rows), enable pagination
2. **Type Detection**: Use explicit `type` for better performance
3. **State Management**: Use unique `tableId` for each table
4. **Custom Styling**: Column type classes can be overridden with Tailwind
5. **Accessibility**: All interactive elements have proper ARIA labels

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
