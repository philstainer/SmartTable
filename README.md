# SmartTable
IE5 compilable custom table library

Example

```js
var myTable = new SmartTable({
  target: document.getElementById('myTargetTable'),
  columns: [ { name: 'id', type: 'ID', label: 'ID' }, { name: 'firstname', type: 'String', label: 'Firstname' } ],
  data: [
    { id: 1, name: 'Bob' },
    { id: 1, name: 'Sam' },
    { id: 1, name: 'John' }
  ],
  buttons: [ { label: 'Delete', action: removeRow } ]
})

// Callback function
function removeRow() {
// Do something here
}
```
