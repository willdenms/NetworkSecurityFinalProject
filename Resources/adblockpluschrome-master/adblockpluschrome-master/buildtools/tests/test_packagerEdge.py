# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

import ConfigParser
import json
import os
import shutil
import xml.etree.ElementTree as ET
import zipfile

import pytest

from buildtools import packager, packagerEdge

TEST_DIR = os.path.dirname(__file__)
TEST_METADATA = os.path.join(TEST_DIR, 'metadata.edge')
CHARS = b''.join(chr(i % 200 + 30) for i in range(500))
MESSAGES_EN_US = json.dumps({
    'name': {'message': 'Adblock Plus'},
    'name_devbuild': {'message': 'devbuild-marker'},
    'description': {
        'message': 'Adblock Plus is the most popular ad blocker ever, '
                   'and also supports websites by not blocking '
                   'unobstrusive ads by default (configurable).'
    },
})


@pytest.fixture
def metadata():
    """Loaded metadata config."""
    conf_parser = ConfigParser.ConfigParser()
    conf_parser.read(TEST_METADATA)
    return conf_parser


@pytest.fixture
def files():
    """Minimal Files() for testing manifest and blockmap."""
    files = packager.Files(set(), set())
    for size in ['44', '50', '150']:
        files['Assets/logo_{}.png'.format(size)] = CHARS
    files['Extension/_locales/en_US/messages.json'] = MESSAGES_EN_US
    files['Extension/foo.xml'] = CHARS
    files['Extension/bar.png'] = CHARS * 200
    return files


@pytest.fixture
def srcdir(tmpdir):
    """Source directory for building the package."""
    srcdir = tmpdir.mkdir('src')
    shutil.copy(TEST_METADATA, str(srcdir.join('metadata.edge')))
    for size in ['44', '50', '150']:
        path = srcdir.join('chrome', 'icons', 'abp-{}.png'.format(size))
        path.write(size, ensure=True)
    localedir = srcdir.mkdir('_locales')
    en_us_dir = localedir.mkdir('en_US')
    en_us_dir.join('messages.json').write(MESSAGES_EN_US)
    return srcdir


def blockmap2dict(xml_data):
    """Convert AppxBlockMap.xml to a dict of dicts easier to inspect."""
    return {
        file.get('Name'): {
            'size': file.get('Size'),
            'lfhsize': file.get('LfhSize'),
            'blocks': [b.get('Hash') for b in file]
        }
        for file in ET.fromstring(xml_data)
    }


def test_create_appx_blockmap(files):
    blockmap = blockmap2dict(packagerEdge.create_appx_blockmap(files))
    assert blockmap['Extension\\foo.xml'] == {
        'size': '500',
        'lfhsize': '47',
        'blocks': ['Vhwfmzss1Ney+j/ssR2QVISvFyMNBQeS2P+UjeE/di0=']
    }
    assert blockmap['Extension\\bar.png'] == {
        'size': '100000',
        'lfhsize': '47',
        'blocks': [
            'KPW2SxeEikUEGhoKmKxruUSexKun0bGXMppOqUFrX5E=',
            'KQHnov1SZ1z34ttdDUjX2leYtpIIGndUVoUteieS2cw=',
        ]
    }


def ctm2dict(content_types_map):
    """Convert content type map to a dict."""
    ret = {'defaults': {}, 'overrides': {}}
    for node in ET.fromstring(content_types_map):
        ct = node.get('ContentType')
        if node.tag.endswith('Default'):
            ret['defaults'][node.get('Extension')] = ct
        elif node.tag.endswith('Override'):
            ret['overrides'][node.get('PartName')] = ct
        else:
            raise ValueError('Unrecognised tag in content map: ' + node.tag)
    return ret


def test_empty_content_types_map():
    ctm_dict = ctm2dict(packagerEdge.create_content_types_map([]))
    assert ctm_dict['defaults'] == {}
    assert ctm_dict['overrides'] == {}


def test_full_content_types_map():
    filenames = ['no-extension', packagerEdge.MANIFEST, packagerEdge.BLOCKMAP]
    filenames += ['file.' + x for x in 'json html js png css git otf'.split()]
    ctm_dict = ctm2dict(packagerEdge.create_content_types_map(filenames))
    assert ctm_dict['defaults'] == {
        'css': 'text/css',
        'html': 'text/html',
        'js': 'application/javascript',
        'json': 'application/json',
        'otf': 'application/x-font-otf',
        'png': 'image/png',
        'xml': 'application/xml'
    }
    assert ctm_dict['overrides'] == {
        '/AppxBlockMap.xml': 'application/vnd.ms-appx.blockmap+xml',
        '/AppxManifest.xml': 'application/vnd.ms-appx.manifest+xml'
    }


def test_create_appx_manifest(metadata, files):
    manifest = packagerEdge.create_appx_manifest(
        {'metadata': metadata}, files, release_build=True,
    )
    with open(os.path.join(TEST_DIR, 'AppManifest.xml.expect')) as fp:
        manifest_expect = fp.read()
    assert manifest.strip() == manifest_expect.strip()


def test_create_devbuild_appx_manifest(metadata, files):
    manifest = packagerEdge.create_appx_manifest(
        {'metadata': metadata}, files, release_build=False,
    )
    assert 'devbuild-marker' in manifest


def test_move_files_to_extension():
    files = packager.Files(set(), set())
    files['foo.xml'] = CHARS
    files['foo/bar.xml'] = CHARS
    files['Extension/foo.xml'] = CHARS
    packagerEdge.move_files_to_extension(files)
    assert set(files.keys()) == {
        'Extension/foo.xml',
        'Extension/foo/bar.xml',
        'Extension/Extension/foo.xml'
    }


def test_create_build(tmpdir, srcdir):
    out_file = str(tmpdir.join('abp.appx'))
    packagerEdge.createBuild(str(srcdir), outFile=out_file, releaseBuild=True)
    appx = zipfile.ZipFile(out_file)

    names = set(appx.namelist())
    assert 'AppxManifest.xml' in names
    assert 'AppxBlockMap.xml' in names
    assert '[Content_Types].xml' in names

    assert 'devbuild-marker' not in appx.read('AppxManifest.xml')
    assert appx.read('Assets/logo_44.png') == '44'
    assert appx.read('Extension/icons/abp-44.png') == '44'


def test_create_devbuild(tmpdir, srcdir):
    out_file = str(tmpdir.join('abp.appx'))
    packagerEdge.createBuild(str(srcdir), outFile=out_file, releaseBuild=False)
    appx = zipfile.ZipFile(out_file)
    assert 'devbuild-marker' in appx.read('AppxManifest.xml')
