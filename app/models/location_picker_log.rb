# When an admin goes to relocate a container the system suggests an optimal location.
# This model logs information about the container that the system suggested, and whether
# or not the operator used the suggested location.
class LocationPickerLog < ApplicationRecord

  belongs_to :container
  belongs_to :container_type

  belongs_to :suggested_location, class_name: "Location"
  belongs_to :chosen_location, class_name: "Location"
  belongs_to :initial_location, class_name: "Location"

end
