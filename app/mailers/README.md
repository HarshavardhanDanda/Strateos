All emails currently fit into one of three categories:
 - emails sent to a specific user (UserMailer)
 - emails sent to all subscribed members of an organization (OrganizationMailer)
 - emails to Transcriptic staff (InternalMailer)

Emails sent to a specific user should be in `user_mailer.rb`.
Emails sent to subscribed members of an organization should be in
`organization_mailer.rb`
Emails sent to transcriptic staff should be in the `internal_mailer.rb`

Please do not create new mailer files.

Currently, all emails use the `app/views/layout/mail.{html,text}.erb` partial.
Individual views reside in in
`app/views/{internal,organization,user}_mailer/method_name.{html,text}.erb`

As a best practice, you should include both a text and html version of your
email.

Emails sent to subscribed members of an organization must include subscription
settings so that a user may opt out of receiving email notifications. Currently,
these are the `notify_for_*` columns on the users table, which are toggled via the
UI at `secure.transcriptic.com/users/edit`. The current mail layout automatically
includes a link to manage notification settings.

Make sure to create a preview for your mailer. These can be viewed at
http://localhost:3000/rails/mailers/. Previews reside in `test/mailers/previews`.

Also include a test for your email. These reside in
`test/mailers/{internal,organization,user}_mailer_test.rb`

