document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // Send mail after the form is submitted
  document.querySelector('#compose-form').onsubmit = send_mail;

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#mail-view').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

  document.querySelector('#compose-recipients').disabled = false;
  document.querySelector('#compose-subject').disabled = false;
  document.querySelector('#compose-body').disabled = false;
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#mail-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#mailbox-title').innerHTML = `<h4>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h4>`;

  // Display a list of mails
  fetch(`emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    document.querySelector('#emails-list').innerHTML = "";
    emails.forEach(email => {

      // Create a div for each mail
      const element = document.createElement('div');
      const line = document.createElement('hr');
      line.style.margin = '0';
      element.className = 'row m-0 pt-3 pb-3';
      element.id = 'mail-list-item';

      // Check if the mail is read
      if (email.read) {
        element.style.backgroundColor = 'rgba(' + 150 + ',' + 150 + ',' + 150 + ',' + 0.4 + ')';
      } else {
        element.style.backgroundColor = 'rgba(' + 255 + ',' + 255 + ',' + 255 + ',' + 0.4 + ')';
      }

      // Make the div clickable
      element.addEventListener('click', () => open_mail(email.id, mailbox));

      element.innerHTML = `
        <span style="font-size: small; font-weight: 500" class="col-2 my-auto">
          ${email.sender}
        </span>
        <h6 class="col my-auto">
          ${email.subject}
        </h6>
        <span style="font-size: small; font-weight: 500; color:gray;" class="col-auto">
          ${email.timestamp}
        </span>
      `;

      // Add the newly created div
      document.querySelector('#emails-list').append(element);
      document.querySelector('#emails-list').append(line);
    });
  });
}

function send_mail() {
  let status = 0;

  // Get the details of the mail to be sent
  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  // Add the mail to the database
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: recipients,
      subject: subject,
      body: body
    })
  })
  .then(response => {
    status = response.status;
    return response.json();
  })
  .then(result => {

    // Load the sent mailbox after the mail has been sent
    if (status == 201) {
      document.getElementById('sent').click();
    } else {
      alert(result.error);
    }
  });

  return false;
}

function open_mail(id, mailbox) {

  // Show the mail view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#mail-view').style.display = 'block';

  // Mark the mail as read
  fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
        read: true
    })
  })

  // Make a GET request
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {

    // Display the mail
    document.querySelector('#mailbox-subject').innerHTML = `<h4 style="display: inline-block;">${email.subject}</h4>`;
    document.querySelector('#mailbox-info').innerHTML = `
      <small class="col">
        <strong style="color: black">
          ${email.sender}
        </strong>
        <br>
        to ${email.recipients}
      </small>
      <small class="col-auto">
        ${email.timestamp}
      </small>
    `;
    document.querySelector('#mailbox-body').innerText = email.body;

    // Create a reply button
    const reply = document.createElement('button');
    reply.className = 'btn btn-outline-secondary btn-sm material-icons';
    reply.innerText = 'reply';
    reply.addEventListener('click', () => reply_mail(email.sender, email.subject, email.body, email.timestamp));

    // Create an archive button
    const archive = document.createElement('button');
    archive.className = 'btn btn-outline-secondary btn-sm material-icons';
    archive.innerText = 'archive';
    archive.addEventListener('click', () => toggle_archive(id, email.archived));

    // Create an unarchive button
    const unarchive = document.createElement('button');
    unarchive.className = 'btn btn-outline-secondary btn-sm material-icons';
    unarchive.innerText = 'unarchive';
    unarchive.addEventListener('click', () => toggle_archive(id, email.archived));

    // Create a back button
    const back = document.createElement('button');
    back.className = 'btn bg-transparent btn-sm material-icons col-auto p-0 m-0 mb-2';
    back.innerText = 'arrow_back_ios';
    back.addEventListener('click', () => load_mailbox(mailbox));

    // Add the back button
    document.querySelector('#mailbox-subject').prepend(back);

    // Clear out the mailbox toolbar
    const toolbar = document.querySelector('#toolbar-buttons');
    toolbar.querySelectorAll('*').forEach(n => n.remove());

    // Add appropriate buttons to the toolbar
    if (mailbox == 'sent') {
      toolbar.append(reply);
    } else if (mailbox == 'archive') {
      toolbar.append(reply);
      toolbar.append(unarchive);
    } else {
      toolbar.append(reply);
      toolbar.append(archive);
    }
  });
}

function toggle_archive(id, state) {

  // Archive or unarchive a mail by making a PUT request
  fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
        archived: !state
    })
  })
  .then(response => {

    // Load the user inbox if the request is successful
    if (response.status = 204) {
      document.getElementById('inbox').click();
    }
  });
}

function reply_mail(sender, subject, body, timestamp) {

  // Load the composition form
  compose_email();

  // Pre-fill the form with appropriate details
  document.getElementById('compose-recipients').value = sender;
  document.getElementById('compose-recipients').disabled = true;

  if (subject.substring(0, 3) == 'Re:') {
    document.getElementById('compose-subject').value = subject; 
  } else {
    document.getElementById('compose-subject').value = `Re: ${subject}`;
  }
  document.getElementById('compose-subject').disabled = true;

  document.getElementById('compose-body').value = `On ${timestamp} ${sender} wrote:\n  ${body}\n----------\n`;
}