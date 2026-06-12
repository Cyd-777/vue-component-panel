export const selectOptions = [
  { label: 'Option 1', value: '1' },
  { label: 'Option 2', value: '2' },
  { label: 'Option 3', value: '3' },
  { label: 'Option 4 (disabled)', value: '4', disabled: true },
]

export const checkboxOptions = [
  { label: 'Option A', value: 'a' },
  { label: 'Option B', value: 'b' },
  { label: 'Option C', value: 'c' },
]

export const cascaderOptions = [
  {
    label: 'Guangdong',
    value: 'gd',
    children: [
      { label: 'Shenzhen', value: 'sz' },
      { label: 'Guangzhou', value: 'gz' },
    ],
  },
  {
    label: 'Hunan',
    value: 'hn',
    children: [{ label: 'Changsha', value: 'cs' }],
  },
]

export const transferData = Array.from({ length: 8 }, (_, i) => ({
  label: `Option ${i + 1}`,
  value: String(i + 1),
  disabled: i === 3,
}))

export const transferDataPaged = Array.from({ length: 20 }, (_, i) => ({
  label: `Item ${i + 1}`,
  value: String(i + 1),
}))

export const tableColumns = [
  { colKey: 'name', title: 'Name' },
  { colKey: 'role', title: 'Role' },
  { colKey: 'status', title: 'Status' },
]

export const tableData = [
  { name: 'Alice', role: 'Design', status: 'Active' },
  { name: 'Bob', role: 'Dev', status: 'Active' },
  { name: 'Carol', role: 'PM', status: 'Inactive' },
]

export const treeData = [
  {
    label: 'Node 1',
    value: '1',
    children: [
      { label: 'Child 1-1', value: '1-1' },
      { label: 'Child 1-2', value: '1-2' },
    ],
  },
  {
    label: 'Node 2',
    value: '2',
    children: [{ label: 'Child 2-1', value: '2-1' }],
  },
]

export const menuTreeData = [
  {
    value: 'menu1',
    label: 'Menu 1',
    children: [
      { value: 'menu1-1', label: 'Submenu 1-1' },
      { value: 'menu1-2', label: 'Submenu 1-2' },
    ],
  },
  { value: 'menu2', label: 'Menu 2' },
  { value: 'menu3', label: 'Disabled', disabled: true },
]
