$(document).ready(function() {
    //Grab api url, this is just checking to see if there is a port in the url
    if (window.location.port == "") {
        var baseUrl = window.location.protocol + "//" + window.location.hostname + window.location.pathname;
    } else {
        var baseUrl = window.location.protocol + "//" + window.location.hostname + ":" + window.location.port + window.location.pathname;
    }

    //grab client id and secret
    var clientId = $('[property="ghost:client_id"]').attr('content'),
        clientSecret = $('[property="ghost:client_secret"]').attr('content'),
        //set pagination to be the number of posts you wish to load
        pagination = 5,
        //set number of characters for the excerpt (includes markdown formatting)
        excerptLength = 52;

    //Set the current page based on what is in the url
    var currentPage = location.href.split("page=")[1];

    //If no values, set it to one
    if (typeof(currentPage) == "undefined") {
        currentPage = 1;
    }

    //Start loading all the posts for the current page
    $.ajax({
        //go grab the pagination number of posts on the current page and include the tags
        url: ghost.url.api('posts', {limit: pagination, page: currentPage, include: 'tags,author'}),
        type: 'get'
    }).done(function(data) {
        console.log(data);

        $('#page-number').append("Page " + currentPage + " of " + data.meta.pagination.pages);

        $('#prev-posts').on("click", function(event){
            if ($(this).is("[disabled]")) {
                event.preventDefault();
            }
        });

        $('#next-posts').on("click", function(event){
            if ($(this).is("[disabled]")) {
                event.preventDefault();
            }
        });

        //if there are no more pages, disable next post button
        if (data.meta.pagination.next == null) {
            $('#next-posts').attr('disabled', 'disabled');
        } else {
            //Enable the button
            $('#next-posts').removeAttr('disabled');

            //If there are more pages, link to the next one
            $('#next-posts').attr('href', baseUrl + '?page=' + data.meta.pagination.next);
        }

        //If there is a previous page
        if (data.meta.pagination.prev == null) {
            $('#prev-posts').attr('disabled', 'disabled');
        }
        else {
            //Enable the button
            $('#prev-posts').removeAttr('disabled');

            //If the previous page is 1, then just remove all the variables, if not, just step down one
            if (data.meta.pagination.prev == 1) {
                $('#prev-posts').attr('href', baseUrl);
            } else {
                $('#prev-posts').attr('href', baseUrl + '?page=' + data.meta.pagination.prev);
            }
        }

        //for each post returned
        $.each(data.posts, function(i, post) {
            //Take the author of the post, and now go get that data to fill in
            $.ajax({
                url: ghost.url.api('users', {id: post.author}),
                type: 'get'
            }).done(function(data) {
                $.each(data.users, function(i, users) {
                    //Now that we have the author and post data, send that to the insertPost function
                    insertPost(post, users);
                });
            });
        });
    }).fail(function(err) {
        console.log(err);
    });

    function insertPost(postData, authorData) {
        //start the inserting of the html
        var postInfo = '<hr />\
              <article class="post">\
                <header class="post-header">\
                    <h2 class="post-title"><a href="' + postData.url + '">' + postData.title + '</a></h2>\
                </header>\
                <section class="post-excerpt">\
                    <p>' + postData.markdown.substring(0, excerptLength) + '<a class="read-more" href="' + postData.url + '">&raquo;</a></p>\
                </section>\
                <footer class="post-meta">'

        //if no author image, dont include it
        if (authorData.image != null) {
            postInfo += '<img class="author-thumb" src="' + authorData.image + '" alt="' + authorData.name + '" nopin="nopin" />'
        }

        postInfo += '<a href="/author/' + authorData.slug + '">' + authorData.name + '</a>';

        //if there are tags, add each of them to the post
        if (postData.tags.length > 0) {
            for (i = 0; i < postData.tags.length; i++) {
                // remove the internal-only tags
                if (postData.tags[i].name.indexOf("#") == -1 && postData.tags[i].slug.indexOf("hash-") == -1) {
                  if (i == 0) {
                    postInfo += ' about ';
                  }

                  postInfo += '<a href="/tag/' + postData.tags[i].slug + '">' + postData.tags[i].name + "</a> " + (postData.tags.length > 1 && i != postData.tags.length - 1 ? ", " : "");
                }
            }
        }

        //Finish off the html with the time
        //The format for the time will be different, you will have to figure this out
        postInfo += '<span> on <time class="post-date" datetime="' + postData.published_at + '">' + moment(postData.published_at).format("DD MMMM YYYY")  + '</time></span>\
                <span> | <a href="' + postData.url + '#disqus_thread"> comments</a></span>\
                </footer>\
            </article>'

        //Append the html to the content of the blog
        $('#content.blog').append(postInfo);
    }
});
