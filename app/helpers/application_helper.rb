module ApplicationHelper
  def create_gmail_goto_action(name, description, target_url)
    # https://developers.google.com/gmail/markup/reference/go-to-action#view_action
    data = {
      "@context" => "http://schema.org",
      "@type"    => "EmailMessage",
      "description": description,
      "potentialAction" => {
        "@type"  => "ViewAction",
        "target" => target_url,
        "url" => target_url,
        "name" => name
      }
    }

    html = JSON.generate(data).html_safe

    content_tag(:script, html, type: 'application/ld+json')
  end

  def current_user_or_admin
    current_user || current_admin
  end
end
