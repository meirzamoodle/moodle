<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <https://www.gnu.org/licenses/>.

namespace core_user\route\schema;

use core\exception\field_errors_exception;
use core\exception\invalid_parameter_exception;
use core\exception\unprocessable_entity_exception;
use core\param;
use core\router\schema\objects\scalar_type;
use core\router\schema\objects\schema_object;
use core\router\schema\objects\type_base;
use core\router\schema\referenced_object;
use core\router\schema\specification;

/**
 * The schema of a request to create a user.
 *
 * @package    core_user
 * @copyright  Meirza Arson <meirza.arson@moodle.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class user_creation extends schema_object implements referenced_object {
    /** @var string[] The fields which must be supplied */
    public const REQUIRED = ['username', 'firstName', 'lastName', 'email'];

    /** @var array The value of each optional field with a default, used when it is omitted */
    public const DEFAULTS = [
        'authenticationMethod' => 'manual',
        'confirmed' => true,
        'suspended' => false,
        'timeZonePreference' => null,
        'generatePassword' => false,
    ];

    /**
     * Constructor.
     *
     * @param mixed[] ...$extra
     */
    public function __construct(...$extra) {
        $extra['content'] = [
            'username' => new scalar_type(param::USERNAME),
            'firstName' => new scalar_type(param::NOTAGS),
            'lastName' => new scalar_type(param::NOTAGS),
            'email' => new scalar_type(param::EMAIL),
            'idnumber' => new scalar_type(param::RAW),
            'firstNamePhonetic' => new scalar_type(param::NOTAGS),
            'lastNamePhonetic' => new scalar_type(param::NOTAGS),
            'middleName' => new scalar_type(param::NOTAGS),
            'alternateName' => new scalar_type(param::NOTAGS),
            'language' => new scalar_type(param::LANG),
            'authenticationMethod' => new scalar_type(param::AUTH),
            'confirmed' => new scalar_type(param::BOOL),
            'suspended' => new scalar_type(param::BOOL),
            'profileImageAlt' => new scalar_type(param::TEXT),
            'timeZonePreference' => new scalar_type(param::TIMEZONE),
            'profile' => new schema_object(content: [
                'city' => new scalar_type(param::TEXT),
                'country' => new scalar_type(param::ALPHA),
                'institution' => new scalar_type(param::TEXT),
                'department' => new scalar_type(param::TEXT),
                'address' => new scalar_type(param::TEXT),
                'description' => new scalar_type(param::RAW),
                'phone' => new scalar_type(param::NOTAGS),
                'mobilePhone' => new scalar_type(param::NOTAGS),
            ]),
            'password' => new scalar_type(param::RAW),
            'generatePassword' => new scalar_type(param::BOOL),
            'sendPasswordEmail' => new scalar_type(param::BOOL),
        ];

        parent::__construct(...$extra);
    }

    /**
     * Validate the request, reporting every missing, unknown and invalid field together.
     *
     * @param mixed $data
     * @return array The data, unchanged
     * @throws unprocessable_entity_exception
     */
    #[\Override]
    public function validate_data(mixed $data) {
        $errors = [];
        foreach (array_diff(self::REQUIRED, array_keys($data)) as $field) {
            $errors[] = field_errors_exception::error('missingfield', get_string('missingfield', 'error', $field), $field);
        }
        $this->validate_object($this, $data, [], $errors);

        if ($errors) {
            throw new unprocessable_entity_exception($errors);
        }

        return $data;
    }

    /**
     * Validate each field of an object against the schema, adding a problem entry for each failure.
     *
     * @param schema_object $schema
     * @param array $data
     * @param string[] $path The names leading to this object in the request
     * @param array $errors The problem entries found so far
     */
    private function validate_object(schema_object $schema, array $data, array $path, array &$errors): void {
        foreach ($data as $key => $value) {
            // Where this field sits in the request, for example ['profile', 'city'], so an error can point at it.
            $fieldpath = [...$path, (string) $key];
            // The same location as a readable name, for example 'profile.city', for the error message.
            $field = implode('.', $fieldpath);

            // Reject a field the schema does not define, then move on to the next field.
            if (!$schema->has($key)) {
                $errors[] = field_errors_exception::error(
                    'unknownfield',
                    get_string('unknownfield', 'error', $field),
                    ...$fieldpath,
                );
                continue;
            }

            $type = $schema->get($key);
            if ($type instanceof schema_object) {
                // A nested object, such as profile, must be a JSON object. That decodes to an associative array,
                // or to an empty array for {}.
                $valid = is_array($value) && ($value === [] || !array_is_list($value));
                if ($valid) {
                    // Check the fields inside it the same way, one level deeper.
                    $this->validate_object($type, $value, $fieldpath, $errors);
                }
            } else {
                // A single value, such as a name or a flag, must match its type.
                $valid = $this->is_valid_scalar($field, $type, $value);
            }

            // Report a value of the wrong kind.
            if (!$valid) {
                $errors[] = field_errors_exception::error(
                    'invalidvalue',
                    get_string('invalidvalue', 'error', $field),
                    ...$fieldpath,
                );
            }
        }
    }

    /**
     * Whether a scalar value is valid for its field.
     *
     * @param string $field
     * @param type_base $type
     * @param mixed $value
     * @return bool
     */
    private function is_valid_scalar(string $field, type_base $type, mixed $value): bool {
        if ($value === null) {
            // Only a field whose default is null may be sent as null.
            return array_key_exists($field, self::DEFAULTS) && self::DEFAULTS[$field] === null;
        }

        try {
            $type->validate_data($value);
            return true;
        } catch (invalid_parameter_exception) {
            return false;
        }
    }

    #[\Override]
    public function get_openapi_description(
        specification $api,
        ?string $path = null,
    ): ?\stdClass {
        $data = parent::get_openapi_description($api, $path);
        $data->required = self::REQUIRED;
        $data->additionalProperties = false;
        $data->properties->profile->additionalProperties = false;
        $data->properties->timeZonePreference->type = ['string', 'null'];
        $data->properties->password->writeOnly = true;
        foreach (self::DEFAULTS as $field => $default) {
            $data->properties->{$field}->default = $default;
        }
        $data->properties->sendPasswordEmail->default = true;

        return $data;
    }
}
