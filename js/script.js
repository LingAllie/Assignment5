$(document).ready(function() {
    
    // === Variables ===
    let currentPage = 1;
    const size = 5;
    let countRecords = 0;
    const selectedDepartments = [];
    let departmentsData = [];
    let selectedRowId = 0;
    let prevName = null;

    // === Fetch Count of Departments ===
    $.ajax({
        url: 'http://localhost:8080/api/v1/departments/count',
        method: 'GET',
        success: function(response) {
            countRecords = response;
        },
        error: function(err) {
            console.log(err.message);
        }
    });

    // === Load Departments Function ===
    function loadDepartments(currentPage, size) {
        $('#spinner').show();
        $.ajax({
            url: `http://localhost:8080/api/v1/departments/${currentPage}/${size}`,
            method: 'GET',
            success: function(response) {

                departmentsData = response;

                // Clear existing rows in the table
                $('#departmentTable tbody').empty();

                // Loop through the response data and populate the table
                response.forEach(function(department, index) {
                    const row = `<tr>
                        <td><input type="checkbox" class="department-checkbox" data-id="${department.departmentId}"></td>
                        <td>${index + 1}</td>
                        <td>${department.departmentName}</td>
                        <td>${department.departmentId}</td>
                        <td>${department.accounts.length}</td>
                    </tr>`;
                    $('#departmentTable tbody').append(row);
                });
                $('#spinner').hide();
            },
            error: function(err) {
                console.log('Error fetching departments:', err);
            }
        });
    }

    // === Call Load Departments on Page Load ===
    loadDepartments(currentPage, size);

    // === Pagination Controls ===

    // Handle "previous" page
    $('#departmentTable .fa-caret-up').click(function() {
        if (currentPage > 1) {
            currentPage--; // Decrease page number
            loadDepartments(currentPage, size);
        }
    });

    // Handle "next" page
    $('#departmentTable .fa-caret-down').click(function() {
        const totalPages = Math.ceil(countRecords / size);
        if (currentPage < totalPages) {
            currentPage++;
            loadDepartments(currentPage, size);
        }
    });

    // === Reload Data ===
    $('#reloadData').click(function() {
        $('#spinner').show();
        loadDepartments(currentPage, size);
    });

    // === Search Departments ===
    function searchDepartment() {
        var searchQuery = $('.search').val();

        if (!isNaN(searchQuery) && searchQuery.trim() !== '') {
            $.ajax({
                url: `http://localhost:8080/api/v1/departments/findById/${searchQuery}`,
                method: 'GET',
                success: function(response) {
                    // Clear existing rows in the table
                    $('#departmentTable tbody').empty();

                    // Create a single row for the department object
                    const row = `<tr>
                        <td><input type="checkbox" class="department-checkbox" data-id="${response.departmentId}"></td>
                        <td>1</td>
                        <td>${response.departmentName}</td>
                        <td>${response.departmentId}</td>
                        <td>###</td>
                    </tr>`;
                    $('#departmentTable tbody').append(row);
                    $('#spinner').hide();
                },
                error: function(err) {
                    console.log('Error fetching departments:', err);
                }
            });
        } else {
            $.ajax({
                url: `http://localhost:8080/api/v1/departments/findByName/${searchQuery}`,
                method: 'GET',
                success: function(response) {
                    // Clear existing rows in the table
                    $('#departmentTable tbody').empty();

                    // Loop through the response data and populate the table
                    response.forEach(function(department, index) {
                        const row = `<tr>
                            <td><input type="checkbox" class="department-checkbox" data-id="${department.departmentId}"></td>
                            <td>${index + 1}</td>
                            <td>${department.departmentName}</td>
                            <td>${department.departmentId}</td>
                            <td>###</td>
                        </tr>`;
                        $('#departmentTable tbody').append(row);
                    });
                    $('#spinner').hide();
                },
                error: function(err) {
                    console.log('Error fetching departments:', err);
                }
            });
        }
    }

    // Handle search icon click
    $('.fa-magnifying-glass').click(function() {
        searchDepartment();
        $('.search').val(" ");
    });

    // === Modal Operations ===

    // Open and close Create Modal
    $('#openCreateModal').click(function() {
        $('#createDepartmentModal').fadeIn();
    });
    $('#createDepartmentModal .modal-buttons button').click(function() {
        const action = $(this).text();
        if (action === "Save") {
            saveDepartment();
        } else {
            closeCreateModal();
        }
    });

    // === Close Modals ===
    function closeCreateModal() {
        $('#departmentName').val('');
        $('#createDepartmentModal .error-message').hide();
        $('#createDepartmentModal').fadeOut();
    }

    // === Save Department ===
    async function saveDepartment() {
        const departmentName = $('#departmentName').val().trim();

        // Check if inputs are empty
        if (departmentName === "") {
            $('#createDepartmentModal .error-message')
                .text('Department Name is required!')
                .fadeIn();
            return; 
        }

        // Check if the department already exists
        const exists = await checkExistByName(departmentName);
        if (exists) {
            $('#createDepartmentModal .error-message')
                .text('Department name already exists!')
                .fadeIn();
            return;
        }

        // Proceed with saving the department
        try {
            await $.ajax({
                url: `http://localhost:8080/api/v1/departments/createDepartment/${departmentName}`,
                method: 'POST',
            });
            closeCreateModal();
            loadDepartments(currentPage, size);
            showNotification('Create successfully!', 'create');
        } catch (error) {
            console.error('Error saving department:', error);
            closeCreateModal();
        }
    }


    // Open and close Edit Modal
    $('.fa-pen').click(function() {
        $('#editDepartmentModal').fadeIn();
        $('#newDepartmentName').val(prevName);
    });
    $('#editDepartmentModal .modal-buttons button').click(function() {
        const action = $(this).text();
        if (action === "Save") {
            editDepartment();
        } else {
            closeEditModal();
        }
    });


    // === Edit Department ===
    function editDepartment() {
        const newDepartmentName = $('#newDepartmentName').val();

        if (newDepartmentName === "") {
            $('#editDepartmentModal .error-message').text('Department Name is required!').fadeIn();
        } else {
            $.ajax({
                url: `http://localhost:8080/api/v1/departments/updateById/${selectedRowId}/${newDepartmentName}`,
                method: 'PUT',
                success: function() {
                    closeEditModal();
                    $('#detailDepartmentName').text(newDepartmentName);
                    showNotification('Edit successfully!', 'edit');
                }
            })
        }
    }

    function closeEditModal() {
        $('#newDepartmentName').val('');
        $('#editDepartmentModal .error-message').hide();
        $('#editDepartmentModal').fadeOut();
    }


    // === Delete Department ===
    $('#openDeleteModal').click(function() {
        // Collect selected departments' IDs
        $('input.department-checkbox:checked').each(function() {
            selectedDepartments.push($(this).data('id'));
        });

        if (selectedDepartments.length === 0) {
            showNotification("No department selected for deletion.", "delete");
            return;
        } else {
            $('#deleteDepartmentModal').fadeIn();
            $('#deleteDepartmentModal h2').text(`Are you sure you want to delete ${selectedDepartments.length} department(s)?`)
        }
    });

    $('#deleteDepartmentModal .modal-buttons button').click(function() {
        const action = $(this).text();
        if (action === "Delete") {
            deleteDepartment();
        } else {
            closeDeleteModal();
        }
    });

    // Delete selected departments
    function deleteDepartment() {
        selectedDepartments.forEach(id => {
            $.ajax({
                url: `http://localhost:8080/api/v1/departments/deleteById/${id}`,
                method: 'DELETE',
                success: function() {
                    $('input.department-checkbox:checked').closest('tr').remove();
                    closeDeleteModal();
                    loadDepartments(currentPage, size);
                    showNotification('Departments deleted successfully!', 'delete');
                },
                error: function(err) {
                    console.error('Error deleting departments:', err);
                    closeDeleteModal();
                    showNotification('Error deleting departments!', 'delete');
                }
            });
        })
    }

    function closeDeleteModal() {
        $('#deleteDepartmentModal').fadeOut();
    }

    
    // === Detail Information ===
    
    function detailForm(departmentId) {
        // Find the department by ID (assuming you have the departmentsData array)
        const department = departmentsData.find(dept => dept.departmentId === departmentId);
        
        if (!department) return;  // If department doesn't exist, do nothing
        
        // Hide the table and show the detail form
        $('.table__wrapper').hide();
        $('#contentTitle').text("Detail Information");
        $('.actions').hide();
        $('.detail-form').fadeIn();
        
        // Set department details in the form
        $('#detailDepartmentID').text(department.departmentId + "·𖥸· ");
        $('#detailDepartmentName').text(prevName);
        
        // Clear previous account details before adding new ones
        $('#accountTable tbody').empty();
        
        // Populate account details dynamically
        department.accounts.forEach(account => {
            const row = `<tr>
            <td>${account.fullName}</td>
            <td>${account.accountId}</td>
            <td>${account.email}</td>
            <td>${account.phone}</td>
            </tr>`;
            
            $('#accountTable tbody').append(row); 
        });
    }
    
    $('#departmentTable tbody').on('click', 'tr', function() {
        const departmentIndex = $(this).index(); 
        const department = departmentsData[departmentIndex];
        prevName = department.departmentName; 
        selectedRowId = department.departmentId; 
        detailForm(department.departmentId);
    });
    
    $('#detail-back-table').click( function() {
        $('.detail-form').hide();
        loadDepartments(currentPage, size);
        $('.table__wrapper').fadeIn();
        $('#contentTitle').text("List Department");
        $('.actions').fadeIn();
    });

    // === Check Department Existence by Name ===
    async function checkExistByName(name) {
        try {
            const response = await $.ajax({
                url: `http://localhost:8080/api/v1/departments/checkDepartmentName/${name}`,
                method: 'GET',
            });
            return response.exists;
        } catch (error) {
            console.error('Error checking department existence:', error);
            return false;
        }
    }
    
    // === Show Notification ===
    function showNotification(message, type) {
        var $notify = $('.notify');
        $notify.find('span').text(message);
        
        // Remove all previous background classes
        $notify.removeClass('green red yellow error');
        
        // Add the appropriate background class based on the type
        if (type === 'create') {
            $notify.addClass('green');
        } else if (type === 'delete') {
            $notify.addClass('red');
        } else if (type === 'edit') {
            $notify.addClass('yellow');
        } else if (type === 'error') {
            $notify.addClass('error');
        }
        
        // Show the notification
        $notify.fadeIn().delay(1000).fadeOut();
    }
});
