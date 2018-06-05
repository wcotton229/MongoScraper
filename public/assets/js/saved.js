// Grab the articles as a json
$.getJSON("/saved", function (data) {
    // For each one
    for (var i = 0; i < data.length; i++) {
        var newRow = $("<div>").addClass("row justify-content-between");
        // Display the apropos information on the page
        newRow.append("<p class='col-8' data-id='" + data[i]._id + "'> <b>" + data[i].title + "</b><br />" + data[i].link + "</p>");
        var buttonDiv = $("<div>").addClass("col-4 justify-content-between");
        buttonDiv.append("<button data-id='" + data[i]._id + "' class='btn btn-primary showarticle'>Article Notes</button>")
        buttonDiv.append("<button data-id='" + data[i]._id + "' class='btn btn-primary deletearticle'>Remove from Saved</button>");
        newRow.append(buttonDiv);
        
        $("#saved-articles").append(newRow).append("<hr>");
        //console.log("appending article #" + i);
    }
});

// Whenever someone clicks a 'Article Notes' tag
$(document).on("click", ".showarticle", function () {
    console.log("show article notes");
    // Empty the notes from the note section
    $("#modal-savednotes").empty();
    $("#modal-note").empty();
    // Save the id from the p tag
    var thisId = $(this).attr("data-id");
    console.log("getting notes for id: " + thisId);

    // Now make an ajax call for the Article
    $.ajax({
        method: "GET",
        url: "/articles/" + thisId
    })
        // With that done, add the note information to the page
        .then(function (data) {
            console.log("Note data returned: " + data);
             console.log("show modal");
            $("#articleNotesModal").modal('show');
            
            $("#savenote").data("art_id", thisId);
            // The title of the article
            $("#modal-note").append("<h2>" + data.title + "</h2>");
            
            // An input to enter a new title
            $("#modal-note").append("<input id='titleinput' name='title' >");
            // A textarea to add a new note body
            $("#modal-note").append("<textarea id='bodyinput' name='body'></textarea>");
            console.log("id: "+ data._id +"notes =" + data.notes);
            if(data.notes) {
                for(var i = 0; i < data.notes.length; i++){
                    var note = data.notes[i];
                    var newRow = $("<div>").addClass("row");
                    // Place the title of the note in the title input
                    var noteTitle = $("<h3>").text(note.title).addClass("noteTitle");
                    //  // Place the body of the note in the body textarea
                    var noteText = $("<p>").text(note.body).addClass("noteBody");
                    newRow.append(noteTitle).append(noteText).append("<hr>");
                    $("#modal-savednotes").append(newRow);
                 }
            }
           
        });
    
});

// When you click the savenote button
$(document).on("click", "#savenote", function () {
    // Grab the id associated with the article from the submit button
    var thisId = $(this).data("art_id");

    // Run a POST request to change the note, using what's entered in the inputs
    $.ajax({
        method: "POST",
        url: "/savenote/" + thisId,
        data: {
            // Value taken from title input
            title: $("#titleinput").val(),
            // Value taken from note textarea
            body: $("#bodyinput").val()
        }
    })
        // With that done
        .then(function (data) {
            // Log the response
            console.log("id: " + data._id);
            // Empty the notes section
            $("#modal-note").empty();
        });

    // Also, remove the values entered in the input and textarea for note entry
    $("#titleinput").val("");
    $("#bodyinput").val("");
});

// Whenever someone clicks a 'Article Notes' tag
$(document).on("click", ".deletearticle", function () {
    console.log("delete article from saved");
    var thisId = $(this).attr("data-id");
    $.ajax({
        method: "POST",
        url: "/unsavearticle/" + thisId
    })
    // With that done, add the note information to the page
    .then(function (data) {
        if(data)
            console.log("changed saved flag");
    });
    location.reload();
});