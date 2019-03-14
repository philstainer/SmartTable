/* Made by: Phil Stainer 

  Version: 1.1

*/

function SmartTable(options) {
  this.options = options
  this.options.paging = { 
    pageSize: this.options.paging && this.options.paging.pageSize && parseInt(this.options.paging.pageSize) ? this.options.paging.pageSize : 10, 
    page: 1 
  }

  this.ready = false
  this.editingRow

  /***** Private Error Messages *****/
  var errorMessages = {
    targetNotFound: 'SmartTable: Target not found.',
    targetNotTable: 'SmartTable: Target is not a table element.',
    missingColumns: 'SmartTable: Missing columns ',
    missingData: 'SmartTable: Could not find data.'
  }

  /***** IE5 fixs *****/
  if (!Function.prototype.bind) {
    Function.prototype.bind = function(oThis) {
      if (typeof this !== 'function') {
        // closest thing possible to the ECMAScript 5
        // internal IsCallable function
        throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
      }
  
      var aArgs   = Array.prototype.slice.call(arguments, 1),
          fToBind = this,
          fNOP    = function() {},
          fBound  = function() {
            return fToBind.apply(this instanceof fNOP && oThis
                   ? this
                   : oThis,
                   aArgs.concat(Array.prototype.slice.call(arguments)));
          };
  
      fNOP.prototype = this.prototype;
      fBound.prototype = new fNOP();
  
      return fBound;
    };
  }

  function addEvent(evnt, elem, func) {
    if (elem.addEventListener)  // W3C DOM
       elem.addEventListener(evnt,func,false);
    else if (elem.attachEvent) { // IE DOM
       elem.attachEvent("on"+evnt, func);
    }
    else { // No much to do
       elem["on"+evnt] = func;
    }
 }

  /***** Private functions *****/
    /* Initial table setup */
    buildTable = function () { 
      var target = this.options.target
      var parent = target.parentElement
      
      var targetWrapper = document.createElement('div')
      targetWrapper.id = target.id + '_wrapper'
      targetWrapper.className = 'smartTable_wrapper'

      parent.replaceChild(targetWrapper, target)

      targetWrapper.appendChild(target)

      this.options.targetWrapper = targetWrapper
      
      target.className = 'smartTable' + ' ' + this.options['class']

      // Faster then innerHTML
      while (target.firstChild) {
        target.removeChild(target.firstChild);
      }

      // Creates thead, tbody
      target.createTHead()

      if (target.createTBody) {
        target.createTBody()
      }
    }

    buildPaging = function () {
      var targetWrapper = this.options.targetWrapper
      var target = this.options.target
      var paging;

      if (this.options.pagingWrapper) {
        while (this.options.pagingWrapper.firstChild) {
          this.options.pagingWrapper.removeChild(this.options.pagingWrapper.firstChild);
        }

        paging = this.options.pagingWrapper
      } else {
        var paging = document.createElement('div')
        this.options.pagingWrapper = paging
        paging.id = target.id + '_paging'
        paging.className = 'smartTable__paging paging__simple'
      }

        var pages = Math.ceil((this.options.data.length / this.options.paging.pageSize))

        var pagingButtonWrapper = document.createElement('div')
        pagingButtonWrapper.className = 'paging-pages'

        var pagingList = document.createElement('ul')

        var pagingPrevLI = document.createElement('li')
        var pagingPrev = document.createElement('a')
        var pagingPrevText = document.createTextNode('\u00AB')
        pagingPrev.appendChild(pagingPrevText)
        pagingPrevLI.appendChild(pagingPrev)
        pagingPrevLI.onclick = pagingChange.bind(this, '-')
        
        var pagingNextLI = document.createElement('li')
        var pagingNext = document.createElement('a')
        var pagingNextText = document.createTextNode('\u00BB')
        pagingNext.appendChild(pagingNextText)
        pagingNextLI.appendChild(pagingNext)
        pagingNextLI.onclick = pagingChange.bind(this, '+')

        pagingList.appendChild(pagingPrevLI)
        pagingList.appendChild(pagingNextLI)

        pagingButtonWrapper.appendChild(pagingList)

        paging.appendChild(pagingButtonWrapper)

        var pagingInputWrapper = document.createElement('div')
        pagingInputWrapper.className = 'paging-current'

        var currentPageInput = document.createElement('input')
        currentPageInput.value = this.options.paging.page

        /* Horrible ie5 fix */
        var context = this

        addEvent('keyup', currentPageInput, function(event) {
          if(event.keyCode === 13) {
            var value;

            if(!event.target) {
              value = event.srcElement.value
            } else {
              value = event.target.value
            }

            pagingChange.call(context, value)
          }
        })

        /* End of Horrible ie5 fix */

        pagingInputWrapper.appendChild(currentPageInput)

        var currentPageSpan = document.createElement('span')
        var currentPageText = document.createTextNode('/ ' + pages)
        currentPageSpan.appendChild(currentPageText)

        pagingInputWrapper.appendChild(currentPageSpan)

        paging.appendChild(pagingInputWrapper)
  
        targetWrapper.appendChild(paging)
    }

    pagingChange = function (action) {
      var paging = this.options.paging

      if(action === '-') {
        if(paging.page !== 1) {
          this.options.paging.page--
        }
      } else if(action === '+') {
        if((paging.page + 1) > paging.page) {
          this.options.paging.page++
        }
      } else {
        var wantedPage = parseInt(action)
        var pages = Math.ceil((this.options.data.length / paging.pageSize))

        if(wantedPage && wantedPage >= 1 && wantedPage <= pages) {
          this.options.paging.page = action
        }
      }

      buildRows.apply(this)
    }

    /* Renders table columns */
    buildColumns = function () {
      var target = this.options.target
      var columns = this.options.columns
      var buttons = this.options.buttons

      if (target.tHead.children.length > 0) {
        target.deleteTHead()
        target.createTHead()
      }

      var columnTR = document.createElement('tr')

      for (var i = 0; i < columns.length; i++) {
        var columnTH = document.createElement('th')
        
        var text;

        if (typeof(columns[i]) === 'string') {
          text = document.createTextNode(columns[i])
        } else {
          if (columns[i].label && columns[i].label != '') {
            text = document.createTextNode(columns[i].label)
          } else {
            text = document.createTextNode(columns[i].name)
          }
        }

        columnTH.appendChild(text)

        columnTR.appendChild(columnTH)
      }

      if(buttons && buttons.length > 0) {
        var columnTH = document.createElement('th')
        columnTR.appendChild(columnTH)
      }

      target.tHead.appendChild(columnTR)
    }


    /* Renders table rows */
    buildRows = function() {
      var columns = this.options.columns
      var data = this.options.data
      var buttons = this.options.buttons

      var targetBody = getTargetBody.apply(this);

      while (targetBody.firstChild) {
        targetBody.removeChild(targetBody.firstChild);
      }

      var startPaging = ((this.options.paging.page * this.options.paging.pageSize) - this.options.paging.pageSize)

      if (data.length === startPaging) {
        this.options.paging.page--
        startPaging = startPaging - this.options.paging.pageSize
      }

      var endPaging = this.options.paging.page * this.options.paging.pageSize

      for (var paging = startPaging; paging < endPaging; paging++) {
        if (data[paging]) {
          var dataTR = document.createElement('tr')

          for (var columnI = 0; columnI < columns.length; columnI++) {
            // Get the column name
            var name = typeof(columns[columnI]) === 'string' ? columns[columnI] : columns[columnI].name

              var dataTD = document.createElement('td')

              var columnType = columns[columnI].type ? columns[columnI].type.toLowerCase() : undefined

              switch (columnType) {
                case 'bit':
                  var checkbox = document.createElement('input')
                  checkbox.type = 'checkbox'
                  checkbox.onclick = toggleCheckBox.bind(this, dataTR, columns[columnI].toggleCallback)
                  checkbox.style.verticalAlign = 'middle'

                  dataTD.style.textAlign = 'center'
                  dataTD.appendChild(checkbox)

                  // IE5 Fix. Checkbox has to be on the DOM before checking
                  checkbox.checked = getCorrectBit(data[paging][name])
                break;
                
                case 'id':
                case 'string':
                case undefined:
                  var text = document.createTextNode(data[paging][name])
      
                  dataTD.appendChild(text) 
                  break;
              
                default:
                  break;
              }


            dataTR.appendChild(dataTD)
          }

          // Render buttons        
          if (buttons && buttons.length > 0) {
            var dataTD = document.createElement('td')

            for (var buttonI = 0; buttonI < buttons.length; buttonI++) {
              var button = document.createElement('button')
              var text = document.createTextNode(buttons[buttonI].label)
              button.appendChild(text)
              

              if(buttons[buttonI].label === 'Edit') {
                button.onclick = editRowCallback.bind(this, dataTR, buttons[buttonI].action)
              } else if(buttons[buttonI].label === 'Delete') {
                button.onclick = deleteRowCallback.bind(this, dataTR, buttons[buttonI].action)
              }

              dataTD.appendChild(button)
            }

            dataTR.appendChild(dataTD)
          }

          targetBody.appendChild(dataTR)    
        }
      }

      buildPaging.apply(this)
    }

    getCorrectBit = function (value) {
      var returnValue

      switch (value) {
        case 'true':
        case 'True':
        case '1':
        case 1:
        case true:
          returnValue = true
          break;
        
        case 'false':
        case 'False':
        case '0':
        case 0:
        case false:
          returnValue = false
          break;
        default:
          returnValue = false
          break;
      }

      return returnValue
    }

    /* Renders table row */
    renderRow = function(data) {
      var columns = this.options.columns
      var buttons = this.options.buttons
      var targetBody = getTargetBody.apply(this);

      var dataTR = document.createElement('tr')

      for (var columnI = 0; columnI < columns.length; columnI++) {
        // Get the column name
        var name;

        if (typeof(columns[columnI]) === 'string') {
          name = columns[columnI]
        } else {
          name = columns[columnI].name
        }

        var dataTD = document.createElement('td')
        var textWrapper = document.createElement('span')

        if (data.hasOwnProperty(name)) {
          var text = document.createTextNode(data[name])

          textWrapper.appendChild(text)
        }

        dataTD.appendChild(textWrapper)

        if (!columns[columnI].readOnly) {
          var textInput = document.createElement('input')
          textInput.style.display = 'none'

          dataTD.appendChild(textInput)
        }
        
        dataTR.appendChild(dataTD)
      }

      if (buttons && buttons.length > 0) {
        var dataTD = document.createElement('td')

        for (var buttonI = 0; buttonI < buttons.length; buttonI++) {
          var button = document.createElement('button')
          var text = document.createTextNode(buttons[buttonI].label)
          button.appendChild(text)
          

          if(buttons[buttonI].label === 'Edit') {
            button.onclick = editRowCallback.bind(this, dataTR, buttons[buttonI].action)
          } else if(buttons[buttonI].label === 'Delete') {
            button.onclick = deleteRowCallback.bind(this, dataTR, buttons[buttonI].action)
          }

          dataTD.appendChild(button)
        }

        dataTR.appendChild(dataTD)
      }

      targetBody.appendChild(dataTR)    
    }

    toggleCheckBox = function(dataTR, callback) {
      var columns = this.options.columns

      var toggleData = {}

      for (var i = 0; i < columns.length; i++) {
        for (var j = 0; j < dataTR.children.length; j++) {
          if (typeof(columns[i]) === 'string') {
            toggleData[columns[i]] = dataTR.children[i].innerText
          } else {
            var columnType = columns[i].type ? columns[i].type.toLowerCase() : undefined
            
            if(columns[i].readOnly || columnType === 'id') {
              toggleData[columns[i].name] = dataTR.children[i].innerText
            } else if (columnType === 'bit') {
              // toggleData[columns[i].name] = dataTR.children[i].children[0].checked
              var value = getBitReturnValue.call(this, dataTR, columns[i].name, dataTR.children[i].children[0].checked)

              if(value !== undefined) {
                toggleData[columns[i].name] = value
              }
            } else {
              toggleData[columns[i].name] = dataTR.children[i].innerText
            }
          }
        }
      }

      updateDataRow.call(this, dataTR, toggleData)

      // Call callback with this context (the table row)
      callback.apply(dataTR, [toggleData])
    }

    /* Edit Table Row Functions */
    editRowCallback = function(dataTR, callback) {
      if (this.editingRow && this.editingRow != '') {
        cancelUpdate.call(this, this.editingRow)
      }

      this.editingRow = dataTR

      for (var i = 0; i < this.options.columns.length; i++) {
        var column = dataTR.children[i]

        var columnType = this.options.columns[i].type ? this.options.columns[i].type.toLowerCase() : undefined

        switch (columnType) {
          case 'id':
            break;

          case 'string':
            break;

          case 'bit':
            var input = getTDInput(column)
            input.onclick = null
            break;

          case undefined:
            if (!this.options.columns[i].readOnly) {
              var input = document.createElement('input')
              input.value = column.innerText

              column.innerText = ''
              column.appendChild(input)
            }
            break;
        
          default:
            break;
        }
      }

      var buttonsRow = dataTR.children[dataTR.children.length - 1]

      while (buttonsRow.firstChild) {
        buttonsRow.removeChild(buttonsRow.firstChild);
      }

      var button = document.createElement('button')
      var text = document.createTextNode('Update')
      button.appendChild(text)
      button.onclick = updateRowCallback.bind(this, dataTR, callback)

      buttonsRow.appendChild(button)

      var cancelUpdateButton = document.createElement('button')
      var text = document.createTextNode('Cancel')
      cancelUpdateButton.appendChild(text)
      cancelUpdateButton.onclick = cancelUpdate.bind(this, dataTR, this.editingRowCopy)
      buttonsRow.appendChild(cancelUpdateButton)
    }

    cancelUpdate = function(tableRow) {
      var data = this.options.data
      var currentDataRow;
      var columns = this.options.columns
      var buttons = this.options.buttons

      var paging = this.options.paging
      var cancelRowIndex = tableRow.rowIndex
      var dataRowIndex = ((((paging.page - 1) * paging.pageSize) + cancelRowIndex) - 1)
      
      for (var i = 0; i < data.length; i++) {
        if (i == dataRowIndex) {
          currentDataRow = data[i]
        }
      }

      if (currentDataRow) {
        for (var j = 0; j < columns.length; j++) {
          var tableTD = tableRow.children[j]

          var columnName = typeof(columns[j]) === 'string' ? columns[j] : columns[j].name

          var columnType = columns[j].type ? columns[j].type.toLowerCase() : undefined
  
          switch (columnType) {
            case 'id':
              break;
  
            case 'bit':
              var input = getTDCheckbox(tableTD)
              // TODO: HERERE
              input.checked = getCorrectBit(currentDataRow[columnName])
              input.onclick = toggleCheckBox.bind(this, tableRow, columns[j].toggleCallback)
              break;
              
            case 'string':
            case undefined:
              if (!columns[j].readOnly) {
                
                while (tableTD.firstChild) {
                  tableTD.removeChild(tableTD.firstChild);
                }

                tableTD.innerText = currentDataRow[columnName]
              }
              break;
          
            default:
              break;
          }
        }
      } else {
        alert(errorMessages.missingData)
      }


        var buttonsRow = tableRow.children[tableRow.children.length - 1]

        while (buttonsRow.firstChild) {
            buttonsRow.removeChild(buttonsRow.firstChild);
        }

        // Render buttons        
        if (buttons && buttons.length > 0) {
            for (var buttonI = 0; buttonI < buttons.length; buttonI++) {
                var button = document.createElement('button')
                var text = document.createTextNode(buttons[buttonI].label)
                button.appendChild(text)


                if (buttons[buttonI].label === 'Edit') {
                    button.onclick = editRowCallback.bind(this, tableRow, buttons[buttonI].action)
                } else if (buttons[buttonI].label === 'Delete') {
                    button.onclick = deleteRowCallback.bind(this, tableRow, buttons[buttonI].action)
                }

                buttonsRow.appendChild(button)
            }
        }

      this.editingRow = null
    }

    updateDataRow = function(tableRow, updateObj) {
      var paging = this.options.paging
      var tableRowIndex = tableRow.rowIndex
      var dataRowIndex = ((((paging.page - 1) * paging.pageSize) + tableRowIndex) - 1)

      var data = this.options.data[dataRowIndex]

      for (var key in updateObj) {
        data[key] =  updateObj[key]
      }
    }

    updateRowCallback = function(dataTR, callback) {
      var columns = this.options.columns

      var updatedRow = {}

      for (var i = 0; i < columns.length; i++) {
        for (var j = 0; j < dataTR.children.length; j++) {
          if (typeof(columns[i]) === 'string') {
            updatedRow[columns[i]] = dataTR.children[i].children[0].value
          } else {
            if (columns[i].required) {
              if (dataTR.children[i].children[0].value === '') {
                alert('This is a required field [' + columns[i].name + ']')
                return
              }
            }
            
            var columnType = columns[i].type ? columns[i].type.toLowerCase() : undefined

            switch (columnType) {
              case 'id':
                updatedRow[columns[i].name] = dataTR.children[i].innerText
              break;

              case 'bit':
                var value = getBitReturnValue.call(this, dataTR, columns[i].name, dataTR.children[i].children[0].checked)

                if(value !== undefined) {
                  updatedRow[columns[i].name] = value
                }
              break;
              
              case 'string':
              case undefined:
                updatedRow[columns[i].name] = columns[i].readOnly ? dataTR.children[i].innerText : dataTR.children[i].children[0].value
                break;
            
              default:
                break;
            }
          }
        }
      }

      updateDataRow.call(this, dataTR, updatedRow)

      // Call callback with this context (the table row)
      callback.apply(dataTR, [updatedRow])

      cancelUpdate.call(this, dataTR)

      return 
    }

    // TODO: FINISH THIS
    getBitReturnValue = function(tableRow, key, value) {
      var columns = this.options.columns
      var paging = this.options.paging

      var tableRowIndex = tableRow.rowIndex
      var dataRowIndex = ((((paging.page - 1) * paging.pageSize) + tableRowIndex) - 1)

      var data = this.options.data[dataRowIndex]

      var newValue

      for (var i = 0; i < columns.length; i++) {
        var columnName = typeof(columns[i]) === 'string' ? columns[i] : columns[i].name

        if(columnName === key) {

          switch (data[key]) {
            case 'true':
            case 'false':
              newValue = value === true ? 'true' : 'false'
              break;
              
            case 'True':
            case 'False':
              newValue = value === true ? 'True' : 'False'
            break;
          
            case '1':
            case '0':
              newValue = value === true ? '1' : '0'
            break;
          
            case 1:
            case 0:
              newValue = value === true ? 1 : 0
            break;
          
            case true:
            case false:
            default:
              newValue = value === true ? true : false
            break;
          }

        }
      }

      return newValue
    }

    getTDInput = function(td) {
      for (var i = 0; i < td.children.length; i++) {
        if (td.children[i].tagName === 'INPUT')
          return td.children[i]        
      }

      return null
    }

    getTDCheckbox = function(td) {
      for (var i = 0; i < td.children.length; i++) {
        if (td.children[i].tagName === 'INPUT' && td.children[i].type === "checkbox")
          return td.children[i]        
      }

      return null
    }

    getTDTextWrapper = function(td) {
      for (var i = 0; i < td.children.length; i++) {
        if (td.children[i].tagName === 'SPAN')
          return td.children[i]        
      }

      return null
    }

    /* Delete Table Row Functions */
    deleteRowCallback = function(dataTR, callback) {
      var columns = this.options.columns

      var deletedRow = {}

      for (var i = 0; i < columns.length; i++) {
        for (var j = 0; j < dataTR.children.length; j++) {
          if (typeof(columns[i]) === 'string') {
            deletedRow[columns[i]] = dataTR.children[i].innerText
          } else {
            deletedRow[columns[i].name] = dataTR.children[i].innerText
          }
        }
      }

      callback.apply(dataTR, [deletedRow])

      var newData = []
      
      var deletedRowIndex = dataTR.rowIndex
      
      var paging = this.options.paging

      var dataRowIndex = ((((paging.page - 1) * paging.pageSize) + deletedRowIndex) - 1)

      for (var i = 0; i < this.options.data.length; i++) {
        if (i != dataRowIndex) {
          newData.push(this.options.data[i])
        }
      }

      this.options.data = newData

      buildRows.apply(this)
    }

    /* Returns the target(table) body element */
    getTargetBody = function() {
      for (var t = 0; t < this.options.target.children.length; t++) {
        if (this.options.target.children[t].tagName === 'TBODY') {
          return this.options.target.children[t]
        }
      }
    }

    /* Check if target is ready */
    checkReady = function () {
      if (!!this.ready) {
        throw new Error(errorMessages.targetNotFound)
      }
    }

    /* Because of IE5, No DEV tools no console... */
    logWarn = function(error) {
      if (console) {
        console.warn(error) 
      }
    }

  /***** METHODS *****/
    this.setTarget = function(target) {
      if (target) {
        if(options.target.tagName !== 'TABLE') { throw new Error(errorMessages.targetNotTable) }
        this.options.target = target
        this.ready = true
        buildColumns.apply(this)
        buildRows.apply(this)
      } else { 
        logWarn(errorMessages.targetNotFound)
      }
    }

    /* Overwrites the data within the table */
    this.setData = function(data) {
      checkReady()

      var targetBody = getTargetBody.apply(this)

      while (targetBody.firstChild) {
        targetBody.removeChild(targetBody.firstChild);
      }

      this.options.data = data
      buildRows.apply(this)
    }
    
    /* Adds a row to the table */
    this.addRow = function(data) {
      checkReady()

      var columns = this.options.columns
      for (var i = 0; i < columns.length; i++) {
        if (typeof(columns[i]) === 'object') {
          if (columns[i].required) {
            if (!data[columns[i].name] || data[columns[i].name] === '') {
              throw new Error('This is a required field [' + columns[i].name + ']')
              return
            }
          }
        }
      }

      this.options.data.push(data)
      renderRow.apply(this, [data])
    }

    /* Usage examples */
    this.examples = {
      basic: function () {
        if (console) {
          var example = ''
          example += 'var example = new SmartTable({' + '\n'
          example += '  target: document.getElementById(\'root\'),' + '\n'
          example += '  data: [ { id: 1, name: \'Tester\' } ], // Data must match column definition' + '\n'
          example += '  columns: [ { name: \'id\' }, \'Name\'],' + '\n'
          example += '  buttons: [ { label: \'Delete\', action: removeRow } ] // Adds button, custom callback function' + '\n'
          example += '})' + '\n'
          example += '\n'
          example += 'function removeRow() { // Callback function here' + '\n'
          example += '  // Do something here' + '\n'
          example += '}' + '\n'
          example += '\n'
          example += 'example.addRow({ id: 2, name: \'Tester2\' }) // Calls SmartTable method to add row'

          console.log(example)
        }
      }
    }

  /* 
    Start here
    Check if target was found
  */

  if (this.options.target) {
    if(this.options.target.tagName !== 'TABLE') { throw new Error(errorMessages.targetNotTable) }
    this.ready = true
    buildTable.apply(this)
    buildColumns.apply(this)
    buildRows.apply(this)
  } else { 
    if(console) {
      logWarn(errorMessages.targetNotFound) 
    }
  }
}
