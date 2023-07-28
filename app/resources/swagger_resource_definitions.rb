require 'aliquot_resource'
require 'batch_resource'
require 'compound_resource'
require 'container_resource'
require 'data_object_resource'
require 'dataset_resource'
require 'instruction_resource'
require 'library_resource'
require 'material_resource'
require 'organization_resource'
require 'project_resource'
require 'protocol_resource'
require 'ref_resource'
require 'run_resource'
require 'upload_resource'
# We alias these resources because as of March 4 2021
# the gem jsonapi-resources will assume that a resource
# in a scope like Api::V1::FooResource will always produce
# routes based on that name, eg api/v1/foos. However, in routes.rb
# we do something spicy with `scope module` to *not* generate any such routes
# and instead have a more minimal api/foos. The aliases below mean we
# can invoke jsonapi-resources like "generate Api::FooResource" (see the rake task)
AliquotResource = Api::V1::AliquotResource
CompoundResource = Api::V1::CompoundResource
ContainerResource = Api::V1::ContainerResource
DataObjectResource = Api::V1::DataObjectResource
DatasetResource = Api::V1::DatasetResource
InstructionResource = Api::V1::InstructionResource
MaterialResource = Api::V1::MaterialResource
OrganizationResource = Api::V1::OrganizationResource
ProjectResource = Api::V1::ProjectResource
ProtocolResource = Api::V1::ProtocolResource
RefResource = Api::V1::RefResource
RunResource = Api::V1::RunResource
UploadResource = Api::V1::UploadResource

module V1
  BatchResource = Api::V1::BatchResource
  LibraryResource = Api::V1::LibraryResource
end
