'use strict';

function find_fkey(text) {
    return text.match(/"fkey": ?"([\dabcdef]{32})"/)[1];
}


function get_fkey_xhr() {
    return $.ajax({
        url: 'https://stackoverflow.com',
    }).pipe(function(data) {
        return find_fkey(data);
    });
}


var so = location.host == 'stackoverflow.com',
    // Set by the Magistrate web app
    mg = document.cookie.includes('MG=43a75127f20447bd98c3a9be0f9f135a'),
    fkey;


var flag_paths = {
        'naa': 'AnswerNotAnAnswer',
        'vlq': 'PostLowQuality',
        'rude': 'PostOffensive',
        'spam': 'PostSpam'
    },
    close_reasons_params = {
        'rec': {'closeReasonId': 'OffTopic', 'closeAsOffTopicReasonId': 16},
        'mcve': {'closeReasonId': 'OffTopic', 'closeAsOffTopicReasonId': 13},
        'typo': {'closeReasonId': 'OffTopic', 'closeAsOffTopicReasonId': 11},
        'unc': {'closeReasonId': 'Unclear'},
        'tb': {'closeReasonId': 'TooBroad'},
        'pob': {'closeReasonId': 'OpinionBased'}
    };


if (so || mg) {
    if (so)
        fkey = find_fkey($('html').html());
    else {
        get_fkey_xhr().done(function(key) {
            fkey = key;
        });
    }

    if (so) {
        let arow, a, aid;
        for (a of $('.answer')) {
            aid = a.dataset.answerid;
            $('<div/>', {class: 'mo-action-row'}).append(
                $('<button/>', {class: 'magistrate_action', postid: aid, text: 'NAA', type: 'naa'}),
                $('<button/>', {class: 'magistrate_action', postid: aid, text: 'VLQ', type: 'vlq'}),
                $('<button/>', {class: 'magistrate_action', postid: aid, text: 'RUDE', type: 'rude'}),
                $('<button/>', {class: 'magistrate_action', postid: aid, text: 'SPAM', type: 'spam'})
            ).insertBefore(a);
        }

        let q = document.getElementById('question'), qid = q.dataset.questionid,
            title = $('a.question-hyperlink', '#question-header').text(),
            main_tag = $('a.post-tag:first').text(),
            google_url = 'https://www.google.com/search?' + $.param({
                q: `site:stackoverflow.com ${main_tag} ${title}`
            });

        $('<div/>', {class: 'mo-action-row'}).append(
            $('<a/>', {href: google_url, target: '_blank'}).append(
                $('<button/>', {class: 'magistrate_action', text: 'SEARCH', type: 'search'})
            ),
            $('<button/>', {class: 'magistrate_action', postid: qid, text: 'REC', type: 'rec'}),
            $('<button/>', {class: 'magistrate_action', postid: qid, text: 'MCVE', type: 'mcve'}),
            $('<button/>', {class: 'magistrate_action', postid: qid, text: 'TYPO', type: 'typo'}),
            $('<button/>', {class: 'magistrate_action', postid: qid, text: 'UNC', type: 'unc'}),
            $('<button/>', {class: 'magistrate_action', postid: qid, text: 'TB', type: 'tb'}),
            $('<button/>', {class: 'magistrate_action', postid: qid, text: 'POB', type: 'pob'}),
            $('<button/>', {class: 'magistrate_action', postid: qid, text: 'RUDE', type: 'rude'}),
            $('<button/>', {class: 'magistrate_action', postid: qid, text: 'SPAM', type: 'spam'})
        ).insertBefore(q);
    }

    $(document).on('click', 'button.magistrate_action', function(event) {
        let button = $(this),
            type = button.attr('type'),
            id = button.attr('postid'),
            xhr;

        if (type in flag_paths) {
            xhr = $.ajax({
                url: `https://stackoverflow.com/flags/posts/${id}/add/${flag_paths[type]}`,
                method: 'POST',
                data: {fkey: fkey}
            });

        } else if (type in close_reasons_params) {
            xhr = $.ajax({
                url: `https://stackoverflow.com/flags/questions/${id}/close/add`,
                method: 'POST',
                data: Object.assign({fkey: fkey}, close_reasons_params[type])
            });

        } else return;

        xhr.then(function(data) {
            button.attr('title', data.Message);
            if (!data.Success)
                return new $.Deferred().reject(data);
            return data;
        }).then(function(data) {
            button.text((i, text) => text + ' ✔');
        }, function(data) {
            button.text((i, text) => text + ' ✖');
        });

    });
}
